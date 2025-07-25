-- Migração para adicionar tabela de posições (positions)
-- Esta tabela armazena o histórico de posições GPS dos veículos

-- ============================================================================
-- Tabela de Posições (Positions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.positions (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    altitude REAL,
    speed REAL DEFAULT 0,
    direction REAL, -- Direção em graus (0-360)
    ignition BOOLEAN DEFAULT FALSE,
    battery_level REAL, -- Porcentagem da bateria
    satellites INTEGER DEFAULT 0,
    accuracy REAL, -- Precisão do GPS em metros
    odometer REAL, -- Quilometragem total
    fuel_level REAL, -- Nível de combustível (porcentagem)
    engine_temp REAL, -- Temperatura do motor
    engine_load REAL, -- Carga do motor (porcentagem)
    rpm INTEGER, -- Rotações por minuto
    voltage REAL, -- Voltagem da bateria
    gsm_signal INTEGER, -- Força do sinal GSM (0-100)
    address TEXT, -- Endereço geocodificado (opcional)
    raw_data JSONB -- Dados brutos do dispositivo
);

-- Política de segurança em nível de linha
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Usuários podem visualizar posições de seus próprios veículos
CREATE POLICY IF NOT EXISTS "Users can view positions of their own vehicles." ON public.positions
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.vehicles WHERE id = vehicle_id));

-- Permitir que o serviço backend insira posições
CREATE POLICY IF NOT EXISTS "Allow backend service to insert positions." ON public.positions
  FOR INSERT
  WITH CHECK (true);

-- Permitir que o serviço backend atualize posições
CREATE POLICY IF NOT EXISTS "Allow backend service to update positions." ON public.positions
  FOR UPDATE
  USING (true);

-- ============================================================================
-- Índices para otimização de performance
-- ============================================================================

-- Índice principal para consultas por veículo e timestamp
CREATE INDEX IF NOT EXISTS idx_positions_vehicle_timestamp 
  ON public.positions(vehicle_id, timestamp DESC);

-- Índice para consultas por timestamp
CREATE INDEX IF NOT EXISTS idx_positions_timestamp 
  ON public.positions(timestamp DESC);

-- Índice para consultas geoespaciais
CREATE INDEX IF NOT EXISTS idx_positions_location 
  ON public.positions(latitude, longitude);

-- Índice para consultas por ignição
CREATE INDEX IF NOT EXISTS idx_positions_ignition 
  ON public.positions(vehicle_id, ignition, timestamp DESC);

-- ============================================================================
-- Função para obter a última posição de um veículo
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_position(vehicle_id_param INT)
RETURNS TABLE (
    id INT,
    vehicle_id INT,
    timestamp TIMESTAMPTZ,
    latitude REAL,
    longitude REAL,
    altitude REAL,
    speed REAL,
    direction REAL,
    ignition BOOLEAN,
    battery_level REAL,
    satellites INTEGER,
    accuracy REAL,
    address TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.vehicle_id,
        p.timestamp,
        p.latitude,
        p.longitude,
        p.altitude,
        p.speed,
        p.direction,
        p.ignition,
        p.battery_level,
        p.satellites,
        p.accuracy,
        p.address
    FROM public.positions p
    WHERE p.vehicle_id = vehicle_id_param
    ORDER BY p.timestamp DESC
    LIMIT 1;
END;
$$;

-- ============================================================================
-- Função para obter posições em um período
-- ============================================================================

CREATE OR REPLACE FUNCTION get_positions_in_period(
    vehicle_id_param INT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    limit_param INT DEFAULT 1000
)
RETURNS TABLE (
    id INT,
    vehicle_id INT,
    timestamp TIMESTAMPTZ,
    latitude REAL,
    longitude REAL,
    speed REAL,
    direction REAL,
    ignition BOOLEAN,
    battery_level REAL,
    satellites INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.vehicle_id,
        p.timestamp,
        p.latitude,
        p.longitude,
        p.speed,
        p.direction,
        p.ignition,
        p.battery_level,
        p.satellites
    FROM public.positions p
    WHERE p.vehicle_id = vehicle_id_param
      AND p.timestamp >= start_time
      AND p.timestamp <= end_time
    ORDER BY p.timestamp ASC
    LIMIT limit_param;
END;
$$;

-- ============================================================================
-- Trigger para atualizar vehicle_status quando uma nova posição é inserida
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vehicle_status_from_position()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar ou inserir status do veículo
    INSERT INTO public.vehicle_status (
        vehicle_id,
        status,
        is_moving,
        last_update,
        lat,
        lng,
        speed,
        direction,
        ignition,
        battery,
        satellites
    ) VALUES (
        NEW.vehicle_id,
        CASE WHEN NEW.ignition THEN 'online' ELSE 'offline' END,
        NEW.speed > 0,
        NEW.timestamp,
        NEW.latitude,
        NEW.longitude,
        NEW.speed,
        NEW.direction::TEXT,
        NEW.ignition,
        NEW.battery_level,
        NEW.satellites
    )
    ON CONFLICT (vehicle_id) DO UPDATE SET
        status = CASE WHEN NEW.ignition THEN 'online' ELSE 'offline' END,
        is_moving = NEW.speed > 0,
        last_update = NEW.timestamp,
        lat = NEW.latitude,
        lng = NEW.longitude,
        speed = NEW.speed,
        direction = NEW.direction::TEXT,
        ignition = NEW.ignition,
        battery = NEW.battery_level,
        satellites = NEW.satellites;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_vehicle_status ON public.positions;
CREATE TRIGGER trigger_update_vehicle_status
    AFTER INSERT ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_status_from_position();