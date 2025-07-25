-- Seed data para o sistema de rastreamento Yukz
-- Dados de teste para demonstrar funcionalidades

-- ============================================================================
-- Inserir dados de teste para veículos
-- ============================================================================

-- Primeiro, vamos criar um usuário de teste se não existir
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@yukz.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir veículos de teste
INSERT INTO public.vehicles (id, user_id, name, type, plate, model, year, color, status, created_at) VALUES
(1, '00000000-0000-0000-0000-000000000001', 'Civic Executivo', 'car', 'ABC-1234', 'Honda Civic', '2023', 'Prata', 'active', NOW() - INTERVAL '30 days'),
(2, '00000000-0000-0000-0000-000000000001', 'Corolla Comercial', 'car', 'XYZ-5678', 'Toyota Corolla', '2022', 'Branco', 'active', NOW() - INTERVAL '25 days'),
(3, '00000000-0000-0000-0000-000000000001', 'HB20 Delivery', 'car', 'DEF-9012', 'Hyundai HB20', '2021', 'Azul', 'active', NOW() - INTERVAL '20 days'),
(4, '00000000-0000-0000-0000-000000000001', 'Onix Vendas', 'car', 'GHI-3456', 'Chevrolet Onix', '2023', 'Preto', 'inactive', NOW() - INTERVAL '15 days'),
(5, '00000000-0000-0000-0000-000000000001', 'Strada Obras', 'truck', 'JKL-7890', 'Fiat Strada', '2020', 'Vermelho', 'active', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Inserir dados de teste para status de veículos
-- ============================================================================

INSERT INTO public.vehicle_status (vehicle_id, status, is_moving, last_update, lat, lng, address, speed, direction, ignition, battery, satellites) VALUES
(1, 'online', true, NOW(), -23.5565, -46.6273, 'Av. Paulista, 1000 - São Paulo, SP', 42.1, 'NE', true, 74.0, 8),
(2, 'online', true, NOW(), -23.5200, -46.6800, 'Marginal Tietê - São Paulo, SP', 73.2, 'W', true, 65.0, 9),
(3, 'online', true, NOW(), -23.5540, -46.6920, 'Vila Madalena - São Paulo, SP', 31.5, 'S', true, 81.1, 7),
(4, 'offline', false, NOW() - INTERVAL '2 days', -23.5600, -46.6500, 'Centro - São Paulo, SP', 0, 'N', false, 45.2, 0),
(5, 'offline', false, NOW() - INTERVAL '1 day', -23.5800, -46.7000, 'Zona Oeste - São Paulo, SP', 0, 'N', false, 78.5, 0)
ON CONFLICT (vehicle_id) DO UPDATE SET
  status = EXCLUDED.status,
  is_moving = EXCLUDED.is_moving,
  last_update = EXCLUDED.last_update,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  address = EXCLUDED.address,
  speed = EXCLUDED.speed,
  direction = EXCLUDED.direction,
  ignition = EXCLUDED.ignition,
  battery = EXCLUDED.battery,
  satellites = EXCLUDED.satellites;

-- ============================================================================
-- Inserir dados de teste para viagens
-- ============================================================================

INSERT INTO public.trips (vehicle_id, start_time, end_time, duration_seconds, distance_meters, start_lat, start_lng, start_address, end_lat, end_lng, end_address, max_speed, avg_speed) VALUES
(1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes', 5400, 3200, -23.5505, -46.6333, 'Centro - São Paulo, SP', -23.5535, -46.6303, 'Av. Paulista - São Paulo, SP', 65.2, 45.8),
(1, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours 30 minutes', 5100, 5800, -23.5400, -46.6400, 'Vila Mariana - São Paulo, SP', -23.5505, -46.6333, 'Centro - São Paulo, SP', 72.3, 52.1),
(2, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', 7200, 45200, -23.5200, -46.6100, 'Zona Leste - São Paulo, SP', -23.5200, -46.6500, 'Zona Norte - São Paulo, SP', 95.6, 78.4),
(2, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '3 hours 30 minutes', 5700, 28700, -23.5100, -46.5900, 'Tatuapé - São Paulo, SP', -23.5200, -46.6100, 'Zona Leste - São Paulo, SP', 88.9, 68.2),
(3, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 minutes', 2700, 8900, -23.5440, -46.6920, 'Pinheiros - São Paulo, SP', -23.5520, -46.6920, 'Vila Madalena - São Paulo, SP', 42.8, 35.6);

-- ============================================================================
-- Inserir dados de teste para eventos
-- ============================================================================

INSERT INTO public.events (vehicle_id, type, timestamp, lat, lng, address, speed, ignition, battery, details) VALUES
(1, 'speed_alert', NOW() - INTERVAL '15 minutes', -23.5545, -46.6293, 'Av. Paulista, 800 - São Paulo, SP', 65.2, true, 74.5, '{"speed_limit": 60, "actual_speed": 65.2}'),
(1, 'ignition_off', NOW() - INTERVAL '1 hour 30 minutes', -23.5535, -46.6303, 'Av. Paulista, 1000 - São Paulo, SP', 0, false, 74.8, '{"duration": 3600}'),
(1, 'ignition_on', NOW() - INTERVAL '30 minutes', -23.5535, -46.6303, 'Av. Paulista, 1000 - São Paulo, SP', 0, true, 74.8, '{}'),
(2, 'speed_alert', NOW() - INTERVAL '10 minutes', -23.5200, -46.6700, 'Marginal Tietê - São Paulo, SP', 95.6, true, 65.4, '{"speed_limit": 90, "actual_speed": 95.6}'),
(2, 'speed_alert', NOW() - INTERVAL '2 hours', -23.5200, -46.6300, 'Marginal Tietê - São Paulo, SP', 92.3, true, 67.2, '{"speed_limit": 90, "actual_speed": 92.3}'),
(3, 'ignition_off', NOW() - INTERVAL '40 minutes', -23.5480, -46.6920, 'Vila Madalena - São Paulo, SP', 0, false, 81.8, '{"duration": 900}'),
(3, 'ignition_on', NOW() - INTERVAL '25 minutes', -23.5480, -46.6920, 'Vila Madalena - São Paulo, SP', 0, true, 81.8, '{}'),
(4, 'location_update', NOW() - INTERVAL '2 days', -23.5600, -46.6500, 'Centro - São Paulo, SP', 0, false, 45.2, '{"last_seen": "2024-01-02T10:30:00Z"}'),
(5, 'location_update', NOW() - INTERVAL '1 day', -23.5800, -46.7000, 'Zona Oeste - São Paulo, SP', 0, false, 78.5, '{"last_seen": "2024-01-03T08:15:00Z"}');

-- ============================================================================
-- Inserir dados de teste para alertas
-- ============================================================================

INSERT INTO public.alerts (user_id, vehicle_id, type, message, timestamp, read) VALUES
('00000000-0000-0000-0000-000000000001', 1, 'speed', 'Civic Executivo excedeu velocidade permitida (65 km/h)', NOW() - INTERVAL '15 minutes', false),
('00000000-0000-0000-0000-000000000001', 2, 'speed', 'Corolla Comercial excedeu velocidade permitida (95 km/h)', NOW() - INTERVAL '10 minutes', false),
('00000000-0000-0000-0000-000000000001', 2, 'speed', 'Corolla Comercial excedeu velocidade permitida (92 km/h)', NOW() - INTERVAL '2 hours', true),
('00000000-0000-0000-0000-000000000001', 4, 'offline', 'Onix Vendas está offline há mais de 24 horas', NOW() - INTERVAL '2 days', false),
('00000000-0000-0000-0000-000000000001', 5, 'offline', 'Strada Obras está offline há mais de 12 horas', NOW() - INTERVAL '1 day', false);

-- ============================================================================
-- Inserir dados de teste para notificações
-- ============================================================================

INSERT INTO public.notifications (user_id, title, message, type, read, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Alerta de Velocidade', 'Civic Executivo excedeu o limite de velocidade', 'warning', false, NOW() - INTERVAL '15 minutes'),
('00000000-0000-0000-0000-000000000001', 'Alerta de Velocidade', 'Corolla Comercial excedeu o limite de velocidade', 'warning', false, NOW() - INTERVAL '10 minutes'),
('00000000-0000-0000-0000-000000000001', 'Veículo Offline', 'Onix Vendas não transmite dados há 2 dias', 'error', false, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000001', 'Veículo Offline', 'Strada Obras não transmite dados há 1 dia', 'error', false, NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000001', 'Sistema Atualizado', 'Nova funcionalidade de rastreamento em tempo real disponível', 'success', true, NOW() - INTERVAL '3 days');

-- ============================================================================
-- Inserir dados de teste para configurações
-- ============================================================================

INSERT INTO public.settings (user_id, notifications_enabled, speed_alert_enabled, speed_alert_value, ignition_alert_enabled, movement_alert_enabled, panic_alert_enabled, battery_alert_enabled, geofence_alert_enabled, map_type, dark_mode, measurement_unit, language) VALUES
('00000000-0000-0000-0000-000000000001', true, true, 80, true, true, true, true, true, 'standard', false, 'km', 'pt-BR')
ON CONFLICT (user_id) DO UPDATE SET
  notifications_enabled = EXCLUDED.notifications_enabled,
  speed_alert_enabled = EXCLUDED.speed_alert_enabled,
  speed_alert_value = EXCLUDED.speed_alert_value,
  ignition_alert_enabled = EXCLUDED.ignition_alert_enabled,
  movement_alert_enabled = EXCLUDED.movement_alert_enabled,
  panic_alert_enabled = EXCLUDED.panic_alert_enabled,
  battery_alert_enabled = EXCLUDED.battery_alert_enabled,
  geofence_alert_enabled = EXCLUDED.geofence_alert_enabled,
  map_type = EXCLUDED.map_type,
  dark_mode = EXCLUDED.dark_mode,
  measurement_unit = EXCLUDED.measurement_unit,
  language = EXCLUDED.language;