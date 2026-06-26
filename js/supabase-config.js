// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================

// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
// Las encontrarás en: Settings → API en tu proyecto de Supabase
// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================

// Reemplaza por tus valores del proyecto nuevo
const SUPABASE_URL = 'https://idakpvwvvjexvalnfooy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkYWtwdnd2dmpleHZhbG5mb295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDE4NDQsImV4cCI6MjA5Nzg3Nzg0NH0.ntp7plvFaVt5EtlF6kEL69dTr9For_Sdn_iszrCiGi8';

// Crea el cliente (CDN v2)
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado', {
  hasFrom: typeof window.supabase?.from,
  hasAuth: typeof window.supabase?.auth
});

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado');
