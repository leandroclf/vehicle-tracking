-- Supabase Migration: Initial Schema for Yukz

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Using Supabase Auth for user management, but keeping a profile table)
-- Supabase handles the actual users table in the 'auth' schema.
-- We create a 'profiles' table in the 'public' schema linked to auth.users.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Function to automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'New User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to call the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('car', 'motorcycle', 'truck', 'boat', 'jetski')) NOT NULL,
    plate TEXT UNIQUE NOT NULL,
    model TEXT,
    year TEXT,
    color TEXT,
    device_imei TEXT UNIQUE, -- IMEI should be unique if tracked
    device_model TEXT,
    device_sim TEXT,
    device_last_maintenance DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- RLS Policies for vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vehicles." ON public.vehicles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vehicle Status Table (Stores the latest known status)
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
    battery REAL, -- Percentage
    satellites INTEGER DEFAULT 0
);
-- RLS Policies for vehicle_status table
ALTER TABLE public.vehicle_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view status of their own vehicles." ON public.vehicle_status
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.vehicles WHERE id = vehicle_id));
-- Note: Updates to this table might be handled by a backend service/trigger later
CREATE POLICY "Allow backend service to update status." ON public.vehicle_status
  FOR ALL
  USING (true); -- Placeholder, refine later with service roles or specific user permissions

-- Trips Table
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
-- RLS Policies for trips table
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view trips of their own vehicles." ON public.trips
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.vehicles WHERE id = vehicle_id));
-- Note: Inserts/Updates might be handled by a backend service
CREATE POLICY "Allow backend service to manage trips." ON public.trips
  FOR ALL
  USING (true); -- Placeholder

-- Events Table (Historical data points, alerts triggers, etc.)
CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    trip_id INT REFERENCES public.trips(id) ON DELETE SET NULL, -- Link event to a trip if applicable
    type TEXT CHECK(type IN ('ignition_on', 'ignition_off', 'speed_alert', 'movement_start', 'movement_stop', 'panic', 'battery_low', 'geofence_enter', 'geofence_exit', 'location_update')) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lat REAL,
    lng REAL,
    address TEXT,
    speed REAL,
    ignition BOOLEAN,
    battery REAL,
    details JSONB -- Store extra details as JSON
);
-- RLS Policies for events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view events of their own vehicles." ON public.events
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.vehicles WHERE id = vehicle_id));
-- Note: Inserts might be handled by a backend service
CREATE POLICY "Allow backend service to insert events." ON public.events
  FOR INSERT
  WITH CHECK (true); -- Placeholder

-- Alerts Table (User-facing notifications)
CREATE TABLE IF NOT EXISTS public.alerts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id INT REFERENCES public.vehicles(id) ON DELETE CASCADE,
    event_id INT REFERENCES public.events(id) ON DELETE SET NULL, -- Link alert to a specific event if applicable
    type TEXT CHECK(type IN ('ignition', 'movement', 'speed', 'panic', 'battery', 'offline', 'geofence')) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE
);
-- RLS Policies for alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own alerts." ON public.alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Settings Table
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
-- RLS Policies for settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings." ON public.settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Function to automatically create settings when a profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to call the function after a new profile is inserted
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- Geofences Table
CREATE TABLE IF NOT EXISTS public.geofences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('circle', 'polygon')) NOT NULL,
    coordinates JSONB NOT NULL, -- Store as GeoJSON-like structure
    radius_meters INTEGER, -- Only for circle type
    alert_on_enter BOOLEAN DEFAULT TRUE,
    alert_on_exit BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- RLS Policies for geofences table
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own geofences." ON public.geofences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_events_vehicle_id_timestamp ON public.events(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id_timestamp ON public.alerts(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON public.geofences(user_id);

