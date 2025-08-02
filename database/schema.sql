-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE medium_type AS ENUM ('light_novel', 'web_novel', 'manga', 'anime');
CREATE TYPE user_role AS ENUM ('visitor', 'contributor', 'moderator', 'admin');
CREATE TYPE mapping_status AS ENUM ('pending', 'approved', 'rejected');

-- Series table
CREATE TABLE series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    title_romaji VARCHAR(255),
    title_english VARCHAR(255),
    author VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ongoing',
    start_year INTEGER,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'contributor',
    points INTEGER DEFAULT 0,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content units table
CREATE TABLE content_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    medium medium_type NOT NULL,
    number INTEGER NOT NULL,
    title VARCHAR(255),
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(series_id, medium, number)
);

-- Arcs table
CREATE TABLE arcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_unit_id UUID NOT NULL REFERENCES content_units(id) ON DELETE CASCADE,
    end_unit_id UUID NOT NULL REFERENCES content_units(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mappings table
CREATE TABLE mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    from_unit_id UUID NOT NULL REFERENCES content_units(id) ON DELETE CASCADE,
    to_unit_id UUID NOT NULL REFERENCES content_units(id) ON DELETE CASCADE,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    notes TEXT,
    status mapping_status DEFAULT 'pending',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_unit_id, to_unit_id)
);

-- Ratings table
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    arc_id UUID NOT NULL REFERENCES arcs(id) ON DELETE CASCADE,
    medium medium_type NOT NULL,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, arc_id, medium)
);

-- Badges table
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT,
    rule_description TEXT NOT NULL,
    points_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges junction table
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Contribution logs table
CREATE TABLE contribution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mapping_id UUID REFERENCES mappings(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_series_title ON series(title);
CREATE INDEX idx_series_tags ON series USING GIN(tags);
CREATE INDEX idx_content_units_series_medium ON content_units(series_id, medium);
CREATE INDEX idx_content_units_series_medium_number ON content_units(series_id, medium, number);
CREATE INDEX idx_mappings_series ON mappings(series_id);
CREATE INDEX idx_mappings_status ON mappings(status);
CREATE INDEX idx_mappings_from_unit ON mappings(from_unit_id);
CREATE INDEX idx_mappings_to_unit ON mappings(to_unit_id);
CREATE INDEX idx_mappings_created_by ON mappings(created_by);
CREATE INDEX idx_ratings_arc_medium ON ratings(arc_id, medium);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_users_points ON users(points DESC);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_contribution_logs_user ON contribution_logs(user_id);
CREATE INDEX idx_contribution_logs_created_at ON contribution_logs(created_at DESC);

-- Create RLS (Row Level Security) policies
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_logs ENABLE ROW LEVEL SECURITY;

-- Series policies (public read, admin write)
CREATE POLICY "Series public read" ON series FOR SELECT USING (true);
CREATE POLICY "Series admin write" ON series FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Users policies
CREATE POLICY "Users public read" ON users FOR SELECT USING (true);
CREATE POLICY "Users own profile" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users admin write" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Content units policies (public read, admin write)
CREATE POLICY "Content units public read" ON content_units FOR SELECT USING (true);
CREATE POLICY "Content units admin write" ON content_units FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Arcs policies (public read, admin write)
CREATE POLICY "Arcs public read" ON arcs FOR SELECT USING (true);
CREATE POLICY "Arcs admin write" ON arcs FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Mappings policies
CREATE POLICY "Mappings public read" ON mappings FOR SELECT USING (true);
CREATE POLICY "Mappings authenticated create" ON mappings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Mappings own update" ON mappings FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Mappings moderator update" ON mappings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);

-- Ratings policies
CREATE POLICY "Ratings public read" ON ratings FOR SELECT USING (true);
CREATE POLICY "Ratings own write" ON ratings FOR ALL USING (user_id = auth.uid());

-- Badges policies (public read, admin write)
CREATE POLICY "Badges public read" ON badges FOR SELECT USING (true);
CREATE POLICY "Badges admin write" ON badges FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- User badges policies
CREATE POLICY "User badges public read" ON user_badges FOR SELECT USING (true);
CREATE POLICY "User badges admin write" ON user_badges FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Contribution logs policies
CREATE POLICY "Contribution logs public read" ON contribution_logs FOR SELECT USING (true);
CREATE POLICY "Contribution logs own read" ON contribution_logs FOR SELECT USING (user_id = auth.uid());

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_units_updated_at BEFORE UPDATE ON content_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_arcs_updated_at BEFORE UPDATE ON arcs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mappings_updated_at BEFORE UPDATE ON mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET points = points + NEW.points 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update user points when contribution log is created
CREATE TRIGGER update_user_points_trigger 
    AFTER INSERT ON contribution_logs 
    FOR EACH ROW EXECUTE FUNCTION update_user_points();

-- Function to auto-promote users to moderator
CREATE OR REPLACE FUNCTION check_moderator_promotion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user meets moderator criteria
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE id = NEW.user_id 
        AND points >= 500 
        AND role = 'contributor'
    ) THEN
        -- Calculate approval rate
        WITH approval_stats AS (
            SELECT 
                COUNT(*) as total_contributions,
                COUNT(*) FILTER (WHERE action = 'approved') as approved_contributions
            FROM contribution_logs 
            WHERE user_id = NEW.user_id 
            AND action IN ('approved', 'rejected')
        )
        UPDATE users 
        SET role = 'moderator' 
        WHERE id = NEW.user_id 
        AND role = 'contributor'
        AND EXISTS (
            SELECT 1 FROM approval_stats 
            WHERE total_contributions >= 10 
            AND (approved_contributions::float / total_contributions) >= 0.8
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check for moderator promotion
CREATE TRIGGER check_moderator_promotion_trigger 
    AFTER INSERT ON contribution_logs 
    FOR EACH ROW EXECUTE FUNCTION check_moderator_promotion();

-- Insert default badges
INSERT INTO badges (name, icon_url, rule_description, points_required) VALUES
('Cartographer', '/badges/cartographer.svg', 'Submit 100 approved mappings', 100),
('Oracle', '/badges/oracle.svg', 'Be the first to map a new series', 0),
('Archivist', '/badges/archivist.svg', 'Make 10 helpful discussion posts', 0),
('Contributor', '/badges/contributor.svg', 'Submit your first mapping', 0),
('Moderator', '/badges/moderator.svg', 'Achieve moderator status', 500);

-- Insert sample data for testing
INSERT INTO series (title, title_english, author, status, start_year, tags) VALUES
('Omniscient Reader''s Viewpoint', 'Omniscient Reader''s Viewpoint', 'Sing Shong', 'ongoing', 2018, ARRAY['fantasy', 'action', 'drama']),
('Solo Leveling', 'Solo Leveling', 'Chugong', 'completed', 2016, ARRAY['fantasy', 'action', 'adventure']),
('The Beginning After The End', 'The Beginning After The End', 'TurtleMe', 'ongoing', 2018, ARRAY['fantasy', 'romance', 'adventure']);

-- Insert sample content units for Omniscient Reader
INSERT INTO content_units (series_id, medium, number, title) 
SELECT 
    s.id,
    'light_novel' as medium,
    generate_series(1, 1000) as number,
    'Chapter ' || generate_series(1, 1000) as title
FROM series s WHERE s.title = 'Omniscient Reader''s Viewpoint';

INSERT INTO content_units (series_id, medium, number, title) 
SELECT 
    s.id,
    'web_novel' as medium,
    generate_series(1, 1000) as number,
    'Chapter ' || generate_series(1, 1000) as title
FROM series s WHERE s.title = 'Omniscient Reader''s Viewpoint';

INSERT INTO content_units (series_id, medium, number, title) 
SELECT 
    s.id,
    'manga' as medium,
    generate_series(1, 200) as number,
    'Chapter ' || generate_series(1, 200) as title
FROM series s WHERE s.title = 'Omniscient Reader''s Viewpoint';

INSERT INTO content_units (series_id, medium, number, title) 
SELECT 
    s.id,
    'anime' as medium,
    generate_series(1, 25) as number,
    'Episode ' || generate_series(1, 25) as title
FROM series s WHERE s.title = 'Omniscient Reader''s Viewpoint';