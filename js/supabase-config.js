// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================
const SUPABASE_URL = 'https://idakpvwvvjexvalnfooy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkYWtwdnd2dmpleHZhbG5mb295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDE4NDQsImV4cCI6MjA5Nzg3Nzg0NH0.ntp7plvFaVt5EtlF6kEL69dTr9For_Sdn_iszrCiGi8';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado');
