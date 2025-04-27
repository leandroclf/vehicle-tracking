-- Yukz Application Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL, -- Store hashed passwords, not plain text
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('car', 'motorcycle', 'truck', 'boat', 'jetski')) NOT NULL,
    plate TEXT UNIQUE NOT NULL,
    model TEXT,
    year TEXT,
    color TEXT,
    device_imei TEXT UNIQUE, -- IMEI should be unique if tracked
    device_model TEXT,
    device_sim TEXT,
    device_last_maintenance TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Status Table (Stores the latest known status)
CREATE TABLE IF NOT EXISTS vehicle_status (
    vehicle_id INTEGER PRIMARY KEY NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    status TEXT CHECK(status IN ('online', 'offline')) DEFAULT 'offline',
    is_moving INTEGER DEFAULT 0, -- Boolean 0 or 1
    last_update TEXT,
    lat REAL,
    lng REAL,
    address TEXT,
    speed REAL DEFAULT 0,
    direction TEXT,
    ignition INTEGER DEFAULT 0, -- Boolean 0 or 1
    battery REAL, -- Percentage
    satellites INTEGER DEFAULT 0
);

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    start_time TEXT NOT NULL,
    end_time TEXT,
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

-- Events Table (Historical data points, alerts triggers, etc.)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL, -- Link event to a trip if applicable
    type TEXT CHECK(type IN ('ignition_on', 'ignition_off', 'speed_alert', 'movement_start', 'movement_stop', 'panic', 'battery_low', 'geofence_enter', 'geofence_exit', 'location_update')) NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lat REAL,
    lng REAL,
    address TEXT,
    speed REAL,
    ignition INTEGER,
    battery REAL,
    details TEXT -- e.g., speed limit exceeded, geofence name
);

-- Alerts Table (User-facing notifications)
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL, -- Link alert to a specific event if applicable
    type TEXT CHECK(type IN ('ignition', 'movement', 'speed', 'panic', 'battery', 'offline', 'geofence')) NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read INTEGER DEFAULT 0 -- Boolean 0 or 1
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled INTEGER DEFAULT 1,
    speed_alert_enabled INTEGER DEFAULT 1,
    speed_alert_value INTEGER DEFAULT 120,
    ignition_alert_enabled INTEGER DEFAULT 1,
    movement_alert_enabled INTEGER DEFAULT 1,
    panic_alert_enabled INTEGER DEFAULT 1,
    battery_alert_enabled INTEGER DEFAULT 1,
    geofence_alert_enabled INTEGER DEFAULT 1,
    map_type TEXT DEFAULT 'standard',
    dark_mode INTEGER DEFAULT 0,
    measurement_unit TEXT DEFAULT 'km',
    language TEXT DEFAULT 'pt-BR'
);

-- Geofences Table
CREATE TABLE IF NOT EXISTS geofences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('circle', 'polygon')) NOT NULL,
    coordinates TEXT NOT NULL, -- Store as JSON string: '[{"lat": ..., "lng": ...}, ...]' for polygon, or '{"lat": ..., "lng": ...}' for circle center
    radius_meters INTEGER, -- Only for circle type
    alert_on_enter INTEGER DEFAULT 1,
    alert_on_exit INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_events_vehicle_id_timestamp ON events(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id_timestamp ON alerts(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON geofences(user_id);

