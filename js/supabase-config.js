// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================

// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
// Las encontrarás en: Settings → API en tu proyecto de Supabase

const SUPABASE_URL = 'https://selkbxqazwxxvinnulpb.supabase.co'; // Ej: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGtieHFhend4eHZpbm51bHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDA5MTUsImV4cCI6MjA3NTQ3NjkxNX0.h5YA8tvXPhktoX8dWRalyPCUSndbZtkBHrOviiB1UiE'; // La clave pública (anon/public)

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado');
