-- ==========================================
-- VESTACHECK - SCHÉMA POSTGRESQL (SUPABASE)
-- ==========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Types Énumérés
-- ==========================================
DO $$ BEGIN
    CREATE TYPE condition_type AS ENUM ('Neuf', 'Très Bon', 'Bon', 'Usage', 'Mauvais');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('Administrateur', 'Agent', 'Propriétaire');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE agency_type AS ENUM ('Siège', 'Établissement');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('Appartement', 'Maison');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE inspection_type AS ENUM ('Entrée', 'Sortie');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE signature_type AS ENUM ('Local', 'Distance', 'Aucune');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tables de Base (Hiérarchie Administrative)
-- ==========================================

-- Organisations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raison_sociale TEXT NOT NULL,
    siret TEXT NOT NULL,
    adresse_postale TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agences
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    email TEXT,
    phone TEXT,
    type agency_type DEFAULT 'Établissement',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- Hash bcrypt
    name TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'Agent',
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    server_version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 3. Métier (Propriétés et Locataires)
-- ==========================================

-- Propriétés (Biens Immobiliers)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    surface FLOAT NOT NULL,
    type property_type DEFAULT 'Appartement',
    room_count INTEGER NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    server_version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- Locataires
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'Actuel',
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    server_version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- Table de liaison Propriété <-> Locataire (N:N car un locataire peut avoir eu plusieurs biens)
CREATE TABLE IF NOT EXISTS property_tenants (
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, tenant_id)
);

-- Modèles de Propriété (Templates)
CREATE TABLE IF NOT EXISTS property_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id),
    organization_id UUID REFERENCES organizations(id),
    rooms JSONB NOT NULL DEFAULT '[]'::jsonb, -- On peut stocker les pièces en JSONB pour les templates simplifiés
    key_inventories JSONB DEFAULT '[]'::jsonb,
    server_version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 4. Inspections (Le cœur du rapport)
-- ==========================================

CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    property_address TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type inspection_type NOT NULL,
    owner_id UUID REFERENCES users(id),
    inspector_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    agency_id UUID REFERENCES agencies(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Données structurées JSONB
    counters JSONB NOT NULL DEFAULT '{"water": 0, "electricity": 0}'::jsonb,
    key_inventories JSONB NOT NULL DEFAULT '[]'::jsonb,
    signatures JSONB NOT NULL DEFAULT '{"tenant": {"type": "Aucune"}, "inspector": {"type": "Aucune"}}'::jsonb,
    
    general_observations TEXT,
    is_finalized BOOLEAN DEFAULT FALSE,
    server_version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 5. Normalisation des Pièces et Éléments
-- ==========================================

-- Pièces (Rooms)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Éléments (Items)
CREATE TABLE IF NOT EXISTS inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    condition condition_type DEFAULT 'Bon',
    comment TEXT,
    display_order INTEGER DEFAULT 0
);

-- Photos
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inspection_items(id) ON DELETE CASCADE,
    compressed_base64 TEXT, -- Miniature offline
    has_full_res BOOLEAN DEFAULT FALSE,
    cloud_url TEXT, -- URL définitive (Cloudinary/Supabase Storage)
    is_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Sécurité : Row Level Security (RLS)
-- ==========================================

-- Activation RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Exemples de politiques basées sur les claims du JWT (organization_id, agency_id)
-- Note : On suppose que ces claims sont injectés dans le token Supabase.

-- Politique globale par Organisation
CREATE POLICY org_isolation_policy ON inspections
    FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Politique spécifique par Agence pour les Agents
CREATE POLICY agency_isolation_policy ON inspections
    FOR ALL USING (
        (auth.jwt() ->> 'role') = 'Administrateur' 
        OR agency_id = (auth.jwt() ->> 'agency_id')::uuid
    );

-- Répéter pour les autres tables métier...
CREATE POLICY org_isolation_properties ON properties
    FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY org_isolation_tenants ON tenants
    FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
