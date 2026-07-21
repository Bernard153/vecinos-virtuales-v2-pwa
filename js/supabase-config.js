// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================
const SUPABASE_URL = 'https://selbkxqazwxxvinnulpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGtieHFhend4eHZpbm51bHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDA5MTUsImV4cCI6MjA3NTQ3NjkxNX0.h5YA8tvXPhktoX8dWRalyPCUSndbZtkBHrOviiB1UiE';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado');
