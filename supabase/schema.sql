-- ========================================
-- VECINOS VIRTUALES - ESQUEMA DE BASE DE DATOS
-- ========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLA: users (Usuarios)
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    unique_number INTEGER UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    avatar TEXT DEFAULT 'basic-1',
    unlocked_avatars TEXT[] DEFAULT '{}',
    featured_credits INTEGER DEFAULT 0,
    blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_neighborhood ON users(neighborhood);
CREATE INDEX idx_users_unique_number ON users(unique_number);
CREATE INDEX idx_users_role ON users(role);

-- ========================================
-- TABLA: products (Productos del Marketplace)
-- ========================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_name TEXT NOT NULL,
    seller_number INTEGER NOT NULL,
    business TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    product TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    quality TEXT NOT NULL CHECK (quality IN ('Excelente', 'Muy Buena', 'Buena', 'Regular')),
    contact TEXT NOT NULL,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para products
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_neighborhood ON products(neighborhood);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_featured ON products(featured);

-- ========================================
-- TABLA: services (Servicios)
-- ========================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    provider_number INTEGER,
    neighborhood TEXT NOT NULL,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    availability TEXT NOT NULL,
    contact TEXT NOT NULL,
    price TEXT,
    rating DECIMAL(2,1) DEFAULT 5.0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para services
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_neighborhood ON services(neighborhood);
CREATE INDEX idx_services_category ON services(category);

-- ========================================
-- TABLA: cultural_posts (Publicaciones Culturales)
-- ========================================
CREATE TABLE cultural_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_number INTEGER NOT NULL,
    neighborhood TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cultural', 'event', 'barter')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    date TEXT,
    time TEXT,
    location TEXT,
    contact TEXT,
    offer_item TEXT,
    want_item TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para cultural_posts
CREATE INDEX idx_cultural_posts_author_id ON cultural_posts(author_id);
CREATE INDEX idx_cultural_posts_neighborhood ON cultural_posts(neighborhood);
CREATE INDEX idx_cultural_posts_type ON cultural_posts(type);

-- ========================================
-- TABLA: improvements (Mejoras del Barrio)
-- ========================================
CREATE TABLE improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_number INTEGER NOT NULL,
    neighborhood TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Alta', 'Media', 'Baja')),
    status TEXT NOT NULL DEFAULT 'Propuesta' CHECK (status IN ('Propuesta', 'En Revisión', 'Aprobada', 'En Progreso', 'Completada', 'Rechazada')),
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para improvements
CREATE INDEX idx_improvements_author_id ON improvements(author_id);
CREATE INDEX idx_improvements_neighborhood ON improvements(neighborhood);
CREATE INDEX idx_improvements_status ON improvements(status);

-- ========================================
-- TABLA: sponsors (Anunciantes)
-- ========================================
CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    contact TEXT NOT NULL,
    website TEXT,
    logo TEXT,
    tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'gold')),
    neighborhoods TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para sponsors
CREATE INDEX idx_sponsors_active ON sponsors(active);
CREATE INDEX idx_sponsors_tier ON sponsors(tier);

-- ========================================
-- TABLA: featured_requests (Solicitudes de Destacado)
-- ========================================
CREATE TABLE featured_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_number INTEGER NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    neighborhood TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    special_price DECIMAL(10,2),
    duration INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para featured_requests
CREATE INDEX idx_featured_requests_user_id ON featured_requests(user_id);
CREATE INDEX idx_featured_requests_status ON featured_requests(status);

-- ========================================
-- TABLA: featured_offers (Ofertas Destacadas Aprobadas)
-- ========================================
CREATE TABLE featured_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES featured_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_number INTEGER NOT NULL,
    neighborhood TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    special_price DECIMAL(10,2),
    duration INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked')),
    good_votes INTEGER DEFAULT 0,
    bad_votes INTEGER DEFAULT 0,
    blocked BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para featured_offers
CREATE INDEX idx_featured_offers_user_id ON featured_offers(user_id);
CREATE INDEX idx_featured_offers_status ON featured_offers(status);
CREATE INDEX idx_featured_offers_neighborhood ON featured_offers(neighborhood);
CREATE INDEX idx_featured_offers_expires_at ON featured_offers(expires_at);

-- ========================================
-- TABLA: offer_votes (Votos en Ofertas Destacadas)
-- ========================================
CREATE TABLE offer_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES featured_offers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('good', 'bad')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(offer_id, user_id)
);

-- Índices para offer_votes
CREATE INDEX idx_offer_votes_offer_id ON offer_votes(offer_id);
CREATE INDEX idx_offer_votes_user_id ON offer_votes(user_id);

-- ========================================
-- TABLA: raffles (Sorteos)
-- ========================================
CREATE TABLE raffles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    prize_type TEXT NOT NULL CHECK (prize_type IN ('avatar', 'credits', 'product', 'custom')),
    prize_data JSONB NOT NULL,
    target TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    winner_name TEXT,
    winner_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    drawn_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para raffles
CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_target ON raffles(target);

-- ========================================
-- TABLA: announcements (Anuncios del Admin)
-- ========================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'event', 'update')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target TEXT NOT NULL,
    important BOOLEAN DEFAULT false,
    is_official BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para announcements
CREATE INDEX idx_announcements_target ON announcements(target);
CREATE INDEX idx_announcements_expires_at ON announcements(expires_at);

-- ========================================
-- TABLA: moderator_logs (Registro de Acciones de Moderadores)
-- ========================================
CREATE TABLE moderator_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderator_name TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para moderator_logs
CREATE INDEX idx_moderator_logs_moderator_id ON moderator_logs(moderator_id);
CREATE INDEX idx_moderator_logs_neighborhood ON moderator_logs(neighborhood);
CREATE INDEX idx_moderator_logs_created_at ON moderator_logs(created_at);

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_posts_updated_at BEFORE UPDATE ON cultural_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_improvements_updated_at BEFORE UPDATE ON improvements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON sponsors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_featured_requests_updated_at BEFORE UPDATE ON featured_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_featured_offers_updated_at BEFORE UPDATE ON featured_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_raffles_updated_at BEFORE UPDATE ON raffles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para users (todos pueden leer, solo el usuario puede actualizar su perfil)
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any user" ON users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para products (todos pueden leer, solo el dueño puede modificar)
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = seller_id);
CREATE POLICY "Moderators can delete any product" ON products FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);

-- Políticas para services
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Users can insert own services" ON services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Users can update own services" ON services FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Users can delete own services" ON services FOR DELETE USING (auth.uid() = provider_id);

-- Políticas para cultural_posts
CREATE POLICY "Cultural posts are viewable by everyone" ON cultural_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON cultural_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON cultural_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON cultural_posts FOR DELETE USING (auth.uid() = author_id);

-- Políticas para improvements
CREATE POLICY "Improvements are viewable by everyone" ON improvements FOR SELECT USING (true);
CREATE POLICY "Users can insert improvements" ON improvements FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Admins can update improvements" ON improvements FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para sponsors (solo admin puede gestionar)
CREATE POLICY "Sponsors are viewable by everyone" ON sponsors FOR SELECT USING (true);
CREATE POLICY "Admins can manage sponsors" ON sponsors FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para featured_requests
CREATE POLICY "Featured requests viewable by owner and admin" ON featured_requests FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create featured requests" ON featured_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update featured requests" ON featured_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para featured_offers
CREATE POLICY "Featured offers are viewable by everyone" ON featured_offers FOR SELECT USING (true);
CREATE POLICY "Admins can manage featured offers" ON featured_offers FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para offer_votes
CREATE POLICY "Users can view all votes" ON offer_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own votes" ON offer_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para raffles
CREATE POLICY "Raffles are viewable by everyone" ON raffles FOR SELECT USING (true);
CREATE POLICY "Admins can manage raffles" ON raffles FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para announcements
CREATE POLICY "Announcements are viewable by everyone" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para moderator_logs
CREATE POLICY "Moderator logs viewable by admins" ON moderator_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Moderators can insert logs" ON moderator_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);

-- ========================================
-- DATOS INICIALES
-- ========================================

-- Insertar servicios por defecto
INSERT INTO services (provider_name, provider_number, neighborhood, service_name, category, description, availability, contact, is_default) VALUES
('Emergencias', 0, 'Todos', 'Policía', 'Emergencias', 'Servicio de emergencias policiales', '24/7', '911', true),
('Emergencias', 0, 'Todos', 'Bomberos', 'Emergencias', 'Servicio de bomberos', '24/7', '100', true),
('Emergencias', 0, 'Todos', 'Ambulancia', 'Emergencias', 'Servicio de emergencias médicas', '24/7', '107', true),
('Servicios Públicos', 0, 'Todos', 'Defensa Civil', 'Emergencias', 'Defensa civil y emergencias', '24/7', '103', true);

-- ========================================
-- COMENTARIOS FINALES
-- ========================================

COMMENT ON TABLE users IS 'Usuarios del sistema con roles y perfiles';
COMMENT ON TABLE products IS 'Productos del marketplace';
COMMENT ON TABLE services IS 'Servicios ofrecidos por usuarios';
COMMENT ON TABLE cultural_posts IS 'Publicaciones culturales, eventos y trueques';
COMMENT ON TABLE improvements IS 'Propuestas de mejoras del barrio';
COMMENT ON TABLE sponsors IS 'Anunciantes y patrocinadores';
COMMENT ON TABLE featured_requests IS 'Solicitudes de ofertas destacadas';
COMMENT ON TABLE featured_offers IS 'Ofertas destacadas aprobadas';
COMMENT ON TABLE offer_votes IS 'Votos en ofertas destacadas (1 por usuario)';
COMMENT ON TABLE raffles IS 'Sorteos y ruleta de la suerte';
COMMENT ON TABLE announcements IS 'Anuncios oficiales del administrador';
COMMENT ON TABLE moderator_logs IS 'Registro de acciones de moderadores';
