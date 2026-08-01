-- Script de création de la base de données VestaCheck (Supabase / PostgreSQL)

-- 1. Types Énumérés (Enums)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Administrateur', 'Agent', 'Propriétaire');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE agency_type AS ENUM ('Siège', 'Établissement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('Appartement', 'Maison');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inspection_type AS ENUM ('Entrée', 'Sortie');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE condition_type AS ENUM ('Neuf', 'Très Bon', 'Bon', 'Usage', 'Mauvais');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raison_sociale TEXT NOT NULL,
    siret TEXT NOT NULL,
    adresse_postale TEXT NOT NULL,
    server_version INT DEFAULT 1,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 3. Agencies
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    email TEXT,
    phone TEXT,
    type agency_type DEFAULT 'Établissement',
    server_version INT DEFAULT 1,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 4. Users (avec informations légales du Bailleur / Propriétaire & Inspecteur)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Agent',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    address TEXT,
    siret TEXT,
    phone TEXT,
    server_version INT DEFAULT 1,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 5. Tenants
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'Actuel',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    server_version INT DEFAULT 1,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 6. Properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    surface DOUBLE PRECISION NOT NULL,
    type property_type DEFAULT 'Appartement',
    room_count INT NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    server_version INT DEFAULT 1,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 7. Property Tenants (Liaison N-N)
CREATE TABLE IF NOT EXISTS public.property_tenants (
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, tenant_id)
);

-- 8. Property Templates
CREATE TABLE IF NOT EXISTS public.property_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    rooms JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_inventories JSONB DEFAULT '[]'::jsonb,
    server_version INT DEFAULT 1,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 9. Inspections
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    property_address TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    type inspection_type NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    inspector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    counters JSONB NOT NULL DEFAULT '{}'::jsonb,
    key_inventories JSONB NOT NULL DEFAULT '[]'::jsonb,
    signatures JSONB NOT NULL DEFAULT '{}'::jsonb,
    general_observations TEXT,
    is_finalized BOOLEAN DEFAULT FALSE,
    server_version INT DEFAULT 1,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- 10. Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INT DEFAULT 0
);

-- 11. Inspection Items
CREATE TABLE IF NOT EXISTS public.inspection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    condition condition_type DEFAULT 'Bon',
    comment TEXT,
    display_order INT DEFAULT 0
);

-- 12. Photos
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE,
    compressed_base64 TEXT,
    has_full_res BOOLEAN DEFAULT FALSE,
    cloud_url TEXT,
    is_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
