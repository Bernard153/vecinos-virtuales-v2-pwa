-- ========================================
-- AGREGAR CAMPOS DE GEOLOCALIZACIÓN
-- ========================================

-- 1. Agregar campos a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS home_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS current_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS current_location JSONB,
ADD COLUMN IF NOT EXISTS is_geo_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- Actualizar home_neighborhood con el neighborhood existente
UPDATE users 
SET home_neighborhood = neighborhood 
WHERE home_neighborhood IS NULL;

-- Actualizar current_neighborhood con el neighborhood existente
UPDATE users 
SET current_neighborhood = neighborhood 
WHERE current_neighborhood IS NULL;

-- 2. Agregar campos a la tabla products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS location JSONB,
ADD COLUMN IF NOT EXISTS is_geolocated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_users_current_neighborhood ON users(current_neighborhood);
CREATE INDEX IF NOT EXISTS idx_users_is_geo_active ON users(is_geo_active);
CREATE INDEX IF NOT EXISTS idx_products_is_geolocated ON products(is_geolocated);
CREATE INDEX IF NOT EXISTS idx_products_location_updated ON products(location_updated_at);

-- 4. Comentarios para documentación
COMMENT ON COLUMN users.home_neighborhood IS 'Barrio donde vive el usuario (fijo)';
COMMENT ON COLUMN users.current_neighborhood IS 'Barrio donde está el usuario actualmente (dinámico)';
COMMENT ON COLUMN users.current_location IS 'Ubicación GPS actual del usuario {lat, lng, accuracy, timestamp}';
COMMENT ON COLUMN users.is_geo_active IS 'Si el usuario tiene geolocalización activa';
COMMENT ON COLUMN users.location_updated_at IS 'Última vez que se actualizó la ubicación';

COMMENT ON COLUMN products.location IS 'Ubicación GPS del producto {lat, lng}';
COMMENT ON COLUMN products.is_geolocated IS 'Si el producto requiere geolocalización activa';
COMMENT ON COLUMN products.location_updated_at IS 'Última vez que se actualizó la ubicación del producto';
