-- ========================================
-- TABLA DE ALERTAS COMUNITARIAS
-- ========================================

CREATE TABLE IF NOT EXISTS community_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'security', 'roadblock', 'event', etc.
    subtype TEXT, -- 'theft', 'works', 'protest', etc.
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location JSONB NOT NULL, -- {lat, lng}
    neighborhood TEXT NOT NULL,
    reported_by UUID REFERENCES users(id),
    active BOOLEAN DEFAULT true,
    end_time TIMESTAMPTZ, -- Para cortes temporales
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_alerts_neighborhood ON community_alerts(neighborhood);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON community_alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON community_alerts(active);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON community_alerts(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE community_alerts ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer alertas de su barrio
CREATE POLICY "Anyone can read alerts"
ON community_alerts FOR SELECT
TO public
USING (true);

-- Política: Usuarios autenticados pueden crear alertas
CREATE POLICY "Authenticated users can create alerts"
ON community_alerts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Solo el creador puede actualizar su alerta
CREATE POLICY "Users can update their own alerts"
ON community_alerts FOR UPDATE
TO authenticated
USING (reported_by = auth.uid());

-- Política: Solo el creador o admin puede eliminar
CREATE POLICY "Users can delete their own alerts"
ON community_alerts FOR DELETE
TO authenticated
USING (reported_by = auth.uid());

-- Comentarios
COMMENT ON TABLE community_alerts IS 'Alertas y reportes de la comunidad (seguridad, cortes, eventos)';
COMMENT ON COLUMN community_alerts.type IS 'Tipo de alerta: security, roadblock, event';
COMMENT ON COLUMN community_alerts.subtype IS 'Subtipo específico: theft, works, protest, etc.';
COMMENT ON COLUMN community_alerts.location IS 'Ubicación GPS {lat, lng}';
COMMENT ON COLUMN community_alerts.active IS 'Si la alerta sigue activa';
COMMENT ON COLUMN community_alerts.end_time IS 'Hora de finalización (para cortes temporales)';
