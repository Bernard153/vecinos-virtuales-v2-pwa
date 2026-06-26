// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================

// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
// Las encontrarás en: Settings → API en tu proyecto de Supabase

const SUPABASE_URL = 'https://idakpvwvvjexvalnfooy.supabase.co'; // Ej: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkYWtwdnd2dmpleHZhbG5mb295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDE4NDQsImV4cCI6MjA5Nzg3Nzg0NH0.ntp7plvFaVt5EtlF6kEL69dTr9For_Sdn_iszrCiGi8; // La clave pública (anon/public)

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado');
