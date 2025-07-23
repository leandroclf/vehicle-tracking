-- Yukz Vehicle Tracking System - Schema Inicial
-- Migração inicial com tabelas notifications e alerts

-- ============================================================================
-- Configuração inicial
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to check if table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  );
END;
$$;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Funções auxiliares
-- ============================================================================

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
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile." 
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
CREATE POLICY IF NOT EXISTS "Users can manage their own notifications." ON public.notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Alertas (Alerts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.alerts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id INT,
    event_id INT,
    type TEXT CHECK(type IN ('ignition', 'movement', 'speed', 'panic', 'battery', 'offline', 'geofence')) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE
);

-- Política de segurança em nível de linha
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage their own alerts." ON public.alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
CREATE POLICY IF NOT EXISTS "Users can manage their own settings." ON public.settings
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
-- Índices para otimização de performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id_timestamp ON public.alerts(user_id, timestamp DESC);