-- ============================================================
-- VECINOS VIRTUALES — BACKUP COMPLETO DE BASE DE DATOS
-- Proyecto: vecinos-virtuales-v2-pwa
-- Fecha: 2026-09-30
-- 
-- INSTRUCCIONES:
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Copiar el resultado completo
-- 3. Guardarlo en un archivo .sql en un lugar seguro
-- 4. Repetir cada semana o antes de cambios importantes
-- ============================================================

-- ============================================================
-- SECCIÓN 1: ESTRUCTURA (SCHEMA)
-- ============================================================

SELECT 
    '-- Tabla: ' || table_name || E'\n' ||
    'CREATE TABLE IF NOT EXISTS public.' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || 
        data_type || 
        COALESCE('(' || character_maximum_length || ')', '') ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        E',\n  '
    ) || E'\n);' as ddl
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================================
-- SECCIÓN 2: POLÍTICAS RLS
-- ============================================================

SELECT 
    '-- Política: ' || policyname || E'\n' ||
    'CREATE POLICY "' || policyname || '" ON public.' || tablename || 
    ' FOR ' || cmd || 
    ' TO ' || roles::text ||
    CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || ';'
    as ddl
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- SECCIÓN 3: FUNCIONES
-- ============================================================

SELECT 
    '-- Función: ' || routine_name || E'\n' ||
    pg_get_functiondef(oid) as ddl
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================================
-- SECCIÓN 4: DATOS — EXPORTACIÓN POR TABLA
-- ============================================================
-- Ejecutar cada bloque por separado y guardar los resultados

SELECT 'users' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.users ORDER BY created_at) t;
SELECT 'billeteras' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.billeteras ORDER BY created_at) t;
SELECT 'wallet_transactions' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.wallet_transactions ORDER BY created_at) t;
SELECT 'products' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.products ORDER BY created_at) t;
SELECT 'sponsors' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.sponsors ORDER BY created_at) t;
SELECT 'folleto_imagenes' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.folleto_imagenes ORDER BY created_at) t;
SELECT 'featured_offers' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.featured_offers ORDER BY created_at) t;
SELECT 'featured_requests' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.featured_requests ORDER BY created_at) t;
SELECT 'announcements' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.announcements ORDER BY created_at) t;
SELECT 'mensajes_admin' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.mensajes_admin ORDER BY created_at) t;
SELECT 'mensajes' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.mensajes ORDER BY created_at) t;
SELECT 'denuncias' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.denuncias ORDER BY created_at) t;
SELECT 'credit_requests' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.credit_requests ORDER BY created_at) t;
SELECT 'cultural_posts' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.cultural_posts ORDER BY created_at) t;
SELECT 'cultural_comments' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.cultural_comments ORDER BY created_at) t;
SELECT 'cultural_likes' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.cultural_likes ORDER BY created_at) t;
SELECT 'improvements' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.improvements ORDER BY created_at) t;
SELECT 'services' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.services ORDER BY created_at) t;
SELECT 'karaoke_videos' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.karaoke_videos ORDER BY created_at) t;
SELECT 'karaoke_comments' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.karaoke_comments ORDER BY created_at) t;
SELECT 'karaoke_likes' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.karaoke_likes ORDER BY created_at) t;
SELECT 'raffles' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.raffles ORDER BY created_at) t;
SELECT 'regalos_enviados' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.regalos_enviados ORDER BY created_at) t;
SELECT 'catalogo_regalos' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.catalogo_regalos ORDER BY created_at) t;
SELECT 'reservations' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.reservations ORDER BY created_at) t;
SELECT 'moderator_logs' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.moderator_logs ORDER BY created_at) t;
SELECT 'advertiser_requests' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.advertiser_requests ORDER BY created_at) t;
SELECT 'app_config' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.app_config ORDER BY created_at) t;
SELECT 'avisos' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.avisos ORDER BY created_at) t;
SELECT 'collaborative_prices' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.collaborative_prices ORDER BY created_at) t;
SELECT 'community_alerts' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.community_alerts ORDER BY created_at) t;
SELECT 'daily_user_actions' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.daily_user_actions ORDER BY created_at) t;
SELECT 'folleto_comments' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.folleto_comments ORDER BY created_at) t;
SELECT 'offer_votes' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.offer_votes ORDER BY created_at) t;
SELECT 'featured_votes' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.featured_votes ORDER BY created_at) t;
SELECT 'landing_content' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.landing_content ORDER BY created_at) t;
SELECT 'user_unlocks' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.user_unlocks ORDER BY created_at) t;
SELECT 'phone_login_codes' as tabla, json_agg(t) as datos FROM (SELECT * FROM public.phone_login_codes ORDER BY created_at) t;

-- ============================================================
-- SECCIÓN 5: STORAGE BUCKETS
-- ============================================================

SELECT 'storage_buckets' as tabla, json_agg(t) as datos FROM (
    SELECT id, name, public FROM storage.buckets ORDER BY name
) t;
