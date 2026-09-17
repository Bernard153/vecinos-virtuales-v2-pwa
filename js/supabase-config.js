// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================

// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
// Las encontrarás en: Settings → API en tu proyecto de Supabase

const SUPABASE_URL = 'https://riuxhhipxagnreruxadv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdXhoaGlweGFnbnJlcnV4YWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTYzMzgsImV4cCI6MjEwNTIzMjMzOH0.HcPy2fYuvXO1KLR23cgjY3Lhgny6kZJw1sagzHFim1Q'; // La clave pública (anon/public)


// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado');
