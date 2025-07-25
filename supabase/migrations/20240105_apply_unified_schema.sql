-- Yukz Vehicle Tracking System - Schema Unificado
-- Este arquivo contém todas as definições de tabelas e configurações necessárias
-- em um único arquivo para facilitar a manutenção.

-- ============================================================================
-- Configuração inicial
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Funções auxiliares
-- ============================================================================

-- Função para executar SQL (usado para migrations)
CREATE OR REPLACE FUNCTION pgexec(sql text) RETURNS json AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  result := json_build_object('success', true);
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object('success', false, 'error', SQLERRM);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- Tabela de Perfis (Profiles)
-- ============================================================================

-- Perfis dos usuários (vinculados ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Política de segurança em nível de linha
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Função para criar automaticamente um perfil quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'New User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função após um novo usuário ser inserido
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Tabela de Veículos (Vehicles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('car', 'motorcycle', 'truck', 'boat', 'jetski')) NOT NULL,
    plate TEXT UNIQUE NOT NULL,
    model TEXT,
    year TEXT,
    color TEXT,
    device_imei TEXT UNIQUE, 
    device_model TEXT,
    device_sim TEXT,
    device_last_maintenance TIMESTAMPTZ,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Política de segurança em nível de linha
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own vehicles." ON public.vehicles;
CREATE POLICY "Users can manage their own vehicles." ON public.vehicles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Status dos Veículos (Vehicle Status)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_status (
    vehicle_id INT PRIMARY KEY REFERENCES public.vehicles(id) ON DELETE CASCADE,
    status TEXT CHECK(status IN ('online', 'offline')) DEFAULT 'offline',
    is_moving BOOLEAN DEFAULT FALSE,
    last_update TIMESTAMPTZ,
    lat REAL,
    lng REAL,
    address TEXT,
    speed REAL DEFAULT 0,
    direction TEXT,
    ignition BOOLEAN DEFAULT FALSE,
    battery REAL, -- Porcentagem
    satellites INTEGER DEFAULT 0
);

-- Política de segurança em nível de linha
ALTER TABLE public.vehicle_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view status of their own vehicles." ON public.vehicle_status;
CREATE POLICY "Users can view status of their own vehicles." ON public.vehicle_status
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.vehicles WHERE id = vehicle_id));
DROP POLICY IF EXISTS "Allow backend service to update status." ON public.vehicle_status;
CREATE POLICY "Allow backend service to update status." ON public.vehicle_status
  FOR ALL
  USING (true);

-- ============================================================================
-- Viagens (Trips)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trips (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    distance_meters INTEGER,
    start_lat REAL,
    start_lng REAL,
    start_address TEXT,
    end_lat REAL,
    end_lng REAL,
    end_address TEXT,
    max_speed REAL,
    avg_speed REAL
);

-- Política de segurança em nível de linha
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view trips of their own vehicles." ON public.trips;
CREATE POLICY "Users can view trips of their own vehicles." ON public.trips
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.vehicles WHERE id = vehicle_id));
DROP POLICY IF EXISTS "Allow backend service to manage trips." ON public.trips;
CREATE POLICY "Allow backend service to manage trips." ON public.trips
  FOR ALL
  USING (true);

-- ============================================================================
-- Eventos (Events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    trip_id INT REFERENCES public.trips(id) ON DELETE SET NULL,
    type TEXT CHECK(type IN ('ignition_on', 'ignition_off', 'speed_alert', 'movement_start', 
                            'movement_stop', 'panic', 'battery_low', 'geofence_enter', 
                            'geofence_exit', 'location_update')) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lat REAL,
    lng REAL,
    address TEXT,
    speed REAL,
    ignition BOOLEAN,
    battery REAL,
    details JSONB -- Detalhes adicionais em formato JSON
);

-- Política de segurança em nível de linha
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view events of their own vehicles." ON public.events;
CREATE POLICY "Users can view events of their own vehicles." ON public.events
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.vehicles WHERE id = vehicle_id));
DROP POLICY IF EXISTS "Allow backend service to insert events." ON public.events;
CREATE POLICY "Allow backend service to insert events." ON public.events
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Alertas (Alerts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.alerts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id INT REFERENCES public.vehicles(id) ON DELETE CASCADE,
    event_id INT REFERENCES public.events(id) ON DELETE SET NULL,
    type TEXT CHECK(type IN ('ignition', 'movement', 'speed', 'panic', 'battery', 'offline', 'geofence')) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE
);

-- Política de segurança em nível de linha
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own alerts." ON public.alerts;
CREATE POLICY "Users can manage their own alerts." ON public.alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Notificações (Notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('info', 'warning', 'error', 'success')) NOT NULL DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Política de segurança em nível de linha
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own notifications." ON public.notifications;
CREATE POLICY "Users can manage their own notifications." ON public.notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar a coluna de timestamp
DROP TRIGGER IF EXISTS update_notifications_timestamp ON public.notifications;
CREATE TRIGGER update_notifications_timestamp
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE PROCEDURE update_modified_column();

-- ============================================================================
-- Configurações (Settings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    speed_alert_enabled BOOLEAN DEFAULT TRUE,
    speed_alert_value INTEGER DEFAULT 120,
    ignition_alert_enabled BOOLEAN DEFAULT TRUE,
    movement_alert_enabled BOOLEAN DEFAULT TRUE,
    panic_alert_enabled BOOLEAN DEFAULT TRUE,
    battery_alert_enabled BOOLEAN DEFAULT TRUE,
    geofence_alert_enabled BOOLEAN DEFAULT TRUE,
    map_type TEXT DEFAULT 'standard',
    dark_mode BOOLEAN DEFAULT FALSE,
    measurement_unit TEXT DEFAULT 'km',
    language TEXT DEFAULT 'pt-BR',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Política de segurança em nível de linha
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own settings." ON public.settings;
CREATE POLICY "Users can manage their own settings." ON public.settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Função para criar configurações automaticamente quando um perfil é criado
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função após um novo perfil ser inserido
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================================================
-- Cercas virtuais (Geofences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.geofences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('circle', 'polygon')) NOT NULL,
    coordinates JSONB NOT NULL, -- Estrutura GeoJSON
    radius_meters INTEGER, -- Apenas para tipo círculo
    alert_on_enter BOOLEAN DEFAULT TRUE,
    alert_on_exit BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Política de segurança em nível de linha
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own geofences." ON public.geofences;
CREATE POLICY "Users can manage their own geofences." ON public.geofences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Tabela de Relatórios (Reports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    vehicle_ids TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    format TEXT NOT NULL DEFAULT 'pdf',
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Política de segurança em nível de linha
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" 
  ON public.reports FOR SELECT 
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
CREATE POLICY "Users can insert their own reports" 
  ON public.reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;
CREATE POLICY "Users can update their own reports" 
  ON public.reports FOR UPDATE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar a coluna updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE PROCEDURE update_modified_column();

-- ============================================================================
-- Índices para otimização de performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_events_vehicle_id_timestamp ON public.events(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id_timestamp ON public.alerts(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON public.geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);