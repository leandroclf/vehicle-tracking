-- ============================================================================
-- Script de inicialização de dados para o sistema de rastreamento veicular
-- ============================================================================

-- Inserir dados de domínio e configurações iniciais

-- ============================================================================
-- Usuários de teste (simulando registros do Supabase Auth)
-- ============================================================================

-- Nota: Em produção, estes usuários seriam criados via Supabase Auth
-- Este script é apenas para desenvolvimento/teste local

-- Inserir usuário administrador de teste
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@yukz.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name": "Administrador Sistema"}'
) ON CONFLICT (id) DO NOTHING;

-- Inserir usuário de teste
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'teste@yukz.com',
  crypt('teste123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name": "Usuário Teste"}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Perfis dos usuários
-- ============================================================================

INSERT INTO public.profiles (id, name, phone, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Administrador Sistema', '+55 11 99999-9999', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Usuário Teste', '+55 11 88888-8888', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- Configurações padrão dos usuários
-- ============================================================================

INSERT INTO public.settings (user_id, notifications_enabled, speed_alert_enabled, speed_alert_value, 
                           ignition_alert_enabled, movement_alert_enabled, panic_alert_enabled,
                           battery_alert_enabled, geofence_alert_enabled, map_type, dark_mode,
                           measurement_unit, language, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', true, true, 120, true, true, true, true, true, 'standard', false, 'km', 'pt-BR', NOW()),
  ('22222222-2222-2222-2222-222222222222', true, true, 100, true, true, true, true, true, 'satellite', false, 'km', 'pt-BR', NOW())
ON CONFLICT (user_id) DO UPDATE SET
  notifications_enabled = EXCLUDED.notifications_enabled,
  speed_alert_enabled = EXCLUDED.speed_alert_enabled,
  speed_alert_value = EXCLUDED.speed_alert_value,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- Veículos de exemplo
-- ============================================================================

INSERT INTO public.vehicles (user_id, name, type, plate, model, year, color, device_imei, device_model, device_sim, status, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Civic Administrativo', 'car', 'ABC-1234', 'Honda Civic', '2022', 'Branco', '123456789012345', 'Teltonika FMB920', '55119999999', 'active', NOW()),
  ('11111111-1111-1111-1111-111111111111', 'Moto Entrega', 'motorcycle', 'MOT-5678', 'Honda CG 160', '2021', 'Vermelha', '123456789012346', 'Queclink GL300W', '55118888888', 'active', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Corolla Pessoal', 'car', 'XYZ-9876', 'Toyota Corolla', '2023', 'Prata', '123456789012347', 'Concox GT06N', '55117777777', 'active', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Caminhão Trabalho', 'truck', 'TRK-1111', 'Mercedes Accelo', '2020', 'Azul', '123456789012348', 'Teltonika FMB640', '55116666666', 'active', NOW())
ON CONFLICT (plate) DO NOTHING;

-- ============================================================================
-- Status inicial dos veículos
-- ============================================================================

INSERT INTO public.vehicle_status (vehicle_id, status, is_moving, last_update, lat, lng, address, speed, direction, ignition, battery, satellites)
SELECT 
  v.id,
  'online',
  false,
  NOW() - INTERVAL '5 minutes',
  CASE 
    WHEN v.plate = 'ABC-1234' THEN -23.5505
    WHEN v.plate = 'MOT-5678' THEN -23.5489
    WHEN v.plate = 'XYZ-9876' THEN -23.5475
    WHEN v.plate = 'TRK-1111' THEN -23.5520
  END,
  CASE 
    WHEN v.plate = 'ABC-1234' THEN -46.6333
    WHEN v.plate = 'MOT-5678' THEN -46.6388
    WHEN v.plate = 'XYZ-9876' THEN -46.6358
    WHEN v.plate = 'TRK-1111' THEN -46.6298
  END,
  CASE 
    WHEN v.plate = 'ABC-1234' THEN 'Av. Paulista, 1000 - São Paulo, SP'
    WHEN v.plate = 'MOT-5678' THEN 'Rua Augusta, 500 - São Paulo, SP'
    WHEN v.plate = 'XYZ-9876' THEN 'Rua Oscar Freire, 200 - São Paulo, SP'
    WHEN v.plate = 'TRK-1111' THEN 'Av. Faria Lima, 1500 - São Paulo, SP'
  END,
  0,
  'N',
  false,
  CASE 
    WHEN v.type = 'motorcycle' THEN 85.5
    ELSE 95.2
  END,
  12
FROM public.vehicles v
ON CONFLICT (vehicle_id) DO UPDATE SET
  status = EXCLUDED.status,
  last_update = EXCLUDED.last_update,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  address = EXCLUDED.address,
  battery = EXCLUDED.battery;

-- ============================================================================
-- Cercas virtuais de exemplo
-- ============================================================================

INSERT INTO public.geofences (user_id, name, description, type, coordinates, radius_meters, alert_on_enter, alert_on_exit, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Escritório Central', 'Cerca virtual do escritório principal', 'circle', 
   '{"type": "Point", "coordinates": [-46.6333, -23.5505]}', 200, true, true, NOW()),
  ('11111111-1111-1111-1111-111111111111', 'Zona de Entrega Centro', 'Área permitida para entregas no centro', 'circle',
   '{"type": "Point", "coordinates": [-46.6388, -23.5489]}', 500, false, true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Casa', 'Residência principal', 'circle',
   '{"type": "Point", "coordinates": [-46.6358, -23.5475]}', 100, true, true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Área de Trabalho', 'Região autorizada para trabalho', 'circle',
   '{"type": "Point", "coordinates": [-46.6298, -23.5520]}', 1000, false, true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Eventos de exemplo (últimas 24 horas)
-- ============================================================================

INSERT INTO public.events (vehicle_id, type, timestamp, lat, lng, address, speed, ignition, battery, details)
SELECT 
  v.id,
  'location_update',
  NOW() - INTERVAL '1 hour' * generate_series(1, 24),
  vs.lat + (random() - 0.5) * 0.01, -- Pequena variação na localização
  vs.lng + (random() - 0.5) * 0.01,
  vs.address,
  random() * 60, -- Velocidade aleatória até 60 km/h
  random() > 0.3, -- 70% chance de ignição ligada
  vs.battery + (random() - 0.5) * 10, -- Pequena variação na bateria
  '{"signal_strength": 85, "satellites": 12}'
FROM public.vehicles v
JOIN public.vehicle_status vs ON v.id = vs.vehicle_id
WHERE v.status = 'active';

-- Eventos específicos de ignição
INSERT INTO public.events (vehicle_id, type, timestamp, lat, lng, address, speed, ignition, battery, details)
SELECT 
  v.id,
  CASE WHEN random() > 0.5 THEN 'ignition_on' ELSE 'ignition_off' END,
  NOW() - INTERVAL '1 hour' * (random() * 12 + 1), -- Últimas 12 horas
  vs.lat,
  vs.lng,
  vs.address,
  CASE WHEN random() > 0.5 THEN random() * 30 ELSE 0 END,
  random() > 0.5,
  vs.battery,
  '{"engine_hours": 1250, "odometer": 45230}'
FROM public.vehicles v
JOIN public.vehicle_status vs ON v.id = vs.vehicle_id
WHERE v.status = 'active';

-- ============================================================================
-- Viagens de exemplo
-- ============================================================================

INSERT INTO public.trips (vehicle_id, start_time, end_time, duration_seconds, distance_meters, 
                         start_lat, start_lng, start_address, end_lat, end_lng, end_address, max_speed, avg_speed)
SELECT 
  v.id,
  NOW() - INTERVAL '1 day' + INTERVAL '1 hour' * generate_series(1, 3),
  NOW() - INTERVAL '1 day' + INTERVAL '1 hour' * generate_series(1, 3) + INTERVAL '45 minutes',
  2700, -- 45 minutos
  15000 + random() * 10000, -- 15-25 km
  vs.lat,
  vs.lng,
  vs.address,
  vs.lat + (random() - 0.5) * 0.1,
  vs.lng + (random() - 0.5) * 0.1,
  'Destino da viagem',
  80 + random() * 40, -- Velocidade máxima entre 80-120 km/h
  45 + random() * 20  -- Velocidade média entre 45-65 km/h
FROM public.vehicles v
JOIN public.vehicle_status vs ON v.id = vs.vehicle_id
WHERE v.status = 'active';

-- ============================================================================
-- Alertas de exemplo
-- ============================================================================

INSERT INTO public.alerts (user_id, vehicle_id, type, message, timestamp, read)
SELECT 
  v.user_id,
  v.id,
  'speed',
  'Veículo ' || v.name || ' excedeu o limite de velocidade (120 km/h)',
  NOW() - INTERVAL '2 hours',
  false
FROM public.vehicles v
WHERE v.plate IN ('ABC-1234', 'XYZ-9876');

INSERT INTO public.alerts (user_id, vehicle_id, type, message, timestamp, read)
SELECT 
  v.user_id,
  v.id,
  'battery',
  'Bateria do veículo ' || v.name || ' está baixa (15%)',
  NOW() - INTERVAL '4 hours',
  true
FROM public.vehicles v
WHERE v.type = 'motorcycle';

-- ============================================================================
-- Notificações de exemplo
-- ============================================================================

INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Bem-vindo ao Sistema!', 'Seu sistema de rastreamento foi configurado com sucesso.', 'success', false, NOW()),
  ('11111111-1111-1111-1111-111111111111', 'Manutenção Programada', 'Lembre-se da manutenção do veículo ABC-1234 na próxima semana.', 'info', false, NOW() - INTERVAL '1 hour'),
  ('22222222-2222-2222-2222-222222222222', 'Configuração Completa', 'Todos os seus veículos foram configurados e estão sendo monitorados.', 'success', true, NOW() - INTERVAL '2 hours'),
  ('22222222-2222-2222-2222-222222222222', 'Alerta de Velocidade', 'Veículo XYZ-9876 excedeu limite de velocidade às 14:30.', 'warning', false, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Relatórios de exemplo
-- ============================================================================

INSERT INTO public.reports (user_id, report_type, start_date, end_date, vehicle_ids, status, format, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'monthly_summary', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, ARRAY['1', '2'], 'completed', 'pdf', NOW() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222', 'trip_details', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, ARRAY['3'], 'processing', 'excel', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Finalização
-- ============================================================================

-- Atualizar sequências para evitar conflitos
SELECT setval('public.vehicles_id_seq', (SELECT MAX(id) FROM public.vehicles));
SELECT setval('public.trips_id_seq', (SELECT MAX(id) FROM public.trips));
SELECT setval('public.events_id_seq', (SELECT MAX(id) FROM public.events));
SELECT setval('public.alerts_id_seq', (SELECT MAX(id) FROM public.alerts));
SELECT setval('public.notifications_id_seq', (SELECT MAX(id) FROM public.notifications));
SELECT setval('public.geofences_id_seq', (SELECT MAX(id) FROM public.geofences));

-- Confirmar que os dados foram inseridos
DO $$
BEGIN
  RAISE NOTICE 'Dados iniciais inseridos com sucesso!';
  RAISE NOTICE 'Usuários criados: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Veículos criados: %', (SELECT COUNT(*) FROM public.vehicles);
  RAISE NOTICE 'Eventos criados: %', (SELECT COUNT(*) FROM public.events);
  RAISE NOTICE 'Cercas virtuais criadas: %', (SELECT COUNT(*) FROM public.geofences);
  RAISE NOTICE 'Alertas criados: %', (SELECT COUNT(*) FROM public.alerts);
END $$;