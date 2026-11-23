// scripts/optimizar-videos.mjs
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- carga de scripts/.env.local (sin dependencias extra) ---
const envPath = fileURLToPath(new URL('./.env.local', import.meta.url));
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'barrio-media';
const PREFIX = 'voces-virtuales';
const APPLY = process.argv.includes('--apply');
const DELETE_ORPHANS = process.argv.includes('--delete-orphans');
const MAX_MB = 10;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en scripts/.env.local');
  process.exit(1);
}

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

try {
  execFileSync(FFMPEG, ['-version'], { stdio: 'ignore' });
} catch {
  console.error('ffmpeg no está instalado o no está en el PATH.');
  process.exit(1);
}


const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const mb = (b) => (Number(b || 0) / 1048576).toFixed(2);

async function listarVideos() {
  const { data, error } = await supabase.storage.from(BUCKET).list(PREFIX, { limit: 1000 });
  if (error) throw error;
  return (data || []).filter(o => /\.(mp4|webm|mov|m4v)$/i.test(o.name));
}

async function filas() {
  const { data, error } = await supabase
    .from('karaoke_videos')
    .select('id,title,video_url,thumbnail_url');
  if (error) throw error;
  return data || [];
}

function rutaDesdeUrl(url) {
  const m = (url || '').match(/\/object\/public\/[^/]+\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function comprimir(input, output) {
  execFileSync(FFMPEG, [
    '-y', '-i', input,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-vf', 'scale=-2:720',
    '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-profile:v', 'main',
    '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
    '-sn',
    '-movflags', '+faststart',
    output
  ], { stdio: 'inherit' });
}


function miniatura(input, output) {
  execFileSync(FFMPEG, [
    '-y', '-ss', '00:00:02', '-i', input,
    '-vframes', '1', '-vf', 'scale=320:-2', output
  ], { stdio: 'inherit' });
}

const videos = await listarVideos();
const rows = await filas();

const porRuta = new Map();
rows.forEach(r => {
  const p = rutaDesdeUrl(r.video_url);
  if (p) porRuta.set(p, r);
});

const usados = videos.filter(v => porRuta.has(`${PREFIX}/${v.name}`));
const huerfanos = videos.filter(v => !porRuta.has(`${PREFIX}/${v.name}`));

console.log('\n=== INVENTARIO ===');
console.log(`Objetos de video: ${videos.length}`);
console.log(`Referenciados por karaoke_videos: ${usados.length}`);
console.log(`Huérfanos: ${huerfanos.length} (${mb(huerfanos.reduce((s, v) => s + Number(v.metadata?.size || 0), 0))} MB)\n`);

if (huerfanos.length) {
  console.log('--- HUÉRFANOS ---');
  huerfanos.forEach(v => console.log(`  ${v.name}  (${mb(v.metadata?.size)} MB)`));
  console.log('');
}

if (!APPLY) {
  console.log('MODO SIMULACIÓN: no se modificó nada.');
  console.log('Para ejecutar de verdad:  node scripts/optimizar-videos.mjs --apply');
  process.exit(0);
}

if (DELETE_ORPHANS && huerfanos.length) {
  console.log('--- BORRANDO HUÉRFANOS ---');
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove(huerfanos.map(v => `${PREFIX}/${v.name}`));
  if (error) console.error('  Error borrando huérfanos:', error.message);
  else console.log(`  ${huerfanos.length} archivos eliminados.\n`);
}

const tmp = mkdtempSync(join(tmpdir(), 'vv-'));
const resumen = [];

for (const v of usados) {
  const ruta = `${PREFIX}/${v.name}`;
  const row = porRuta.get(ruta);
  const antes = Number(v.metadata?.size || 0);

  if (antes <= MAX_MB * 1048576) {
    console.log(`SKIP ${v.name} (ya pesa ${mb(antes)} MB)`);
    continue;
  }

  console.log(`\n>>> ${row.title || v.name}`);
  console.log(`    antes: ${mb(antes)} MB`);

  const base = basename(v.name).replace(/\.\w+$/, '');
  const entrada = join(tmp, v.name);
  const salida = join(tmp, base + '-opt.mp4');
  const thumb = join(tmp, base + '-thumb.jpg');

  const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(ruta);
  if (dlErr) { console.error('  descarga falló:', dlErr.message); continue; }
  writeFileSync(entrada, Buffer.from(await blob.arrayBuffer()));

  comprimir(entrada, salida);
  miniatura(salida, thumb);

  const despues = statSync(salida).size;
  console.log(`    después: ${mb(despues)} MB  (${Math.round((1 - despues / antes) * 100)}% menos)`);

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, readFileSync(salida), {
      contentType: 'video/mp4',
      cacheControl: '31536000',
      upsert: true
    });
  if (upErr) { console.error('  subida falló:', upErr.message); continue; }

  const thumbRuta = `${PREFIX}/thumbs/${base}-thumb.jpg`;
  const { error: thErr } = await supabase.storage
    .from(BUCKET)
    .upload(thumbRuta, readFileSync(thumb), {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: true
    });
  if (thErr) console.error('  miniatura falló:', thErr.message);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(thumbRuta);
  await supabase.from('karaoke_videos')
    .update({ thumbnail_url: pub.publicUrl })
    .eq('id', row.id);

  resumen.push({ titulo: row.title, antes, despues });
}

rmSync(tmp, { recursive: true, force: true });

console.log('\n=== RESUMEN ===');
let totalAntes = 0, totalDespues = 0;
resumen.forEach(r => {
  totalAntes += r.antes;
  totalDespues += r.despues;
  console.log(`${r.titulo}: ${mb(r.antes)} MB -> ${mb(r.despues)} MB`);
});
console.log(`TOTAL: ${mb(totalAntes)} MB -> ${mb(totalDespues)} MB`);
