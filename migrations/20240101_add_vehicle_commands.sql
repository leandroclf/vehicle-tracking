-- Migração para sistema de comandos remotos
-- Arquivo: 20240101_add_vehicle_commands.sql

-- Enum para tipos de comando
CREATE TYPE command_type AS ENUM (
  'block_vehicle',
  'unblock_vehicle', 
  'activate_siren',
  'deactivate_siren',
  'flash_lights',
  'request_location',
  'emergency_stop'
);

-- Enum para status do comando
CREATE TYPE command_status AS ENUM (
  'pending_confirmation',
  'confirmed',
  'sent_to_device',
  'executed',
  'failed',
  'expired',
  'cancelled'
);

-- Tabela principal de comandos
CREATE TABLE vehicle_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type command_type NOT NULL,
  status command_status DEFAULT 'pending_confirmation',
  confirmation_required BOOLEAN DEFAULT true,
  confirmation_token VARCHAR(64),
  confirmation_expires_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  response_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de confirmações
CREATE TABLE command_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id UUID NOT NULL REFERENCES vehicle_commands(id) ON DELETE CASCADE,
  confirmation_token VARCHAR(64) NOT NULL,
  confirmed_by UUID NOT NULL REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Tabela de respostas dos dispositivos
CREATE TABLE command_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id UUID NOT NULL REFERENCES vehicle_commands(id) ON DELETE CASCADE,
  device_response JSONB NOT NULL,
  execution_time INTEGER, -- em milissegundos
  success BOOLEAN NOT NULL,
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_vehicle_commands_vehicle_id ON vehicle_commands(vehicle_id);
CREATE INDEX idx_vehicle_commands_user_id ON vehicle_commands(user_id);
CREATE INDEX idx_vehicle_commands_status ON vehicle_commands(status);
CREATE INDEX idx_vehicle_commands_created_at ON vehicle_commands(created_at);
CREATE INDEX idx_command_confirmations_command_id ON command_confirmations(command_id);
CREATE INDEX idx_command_responses_command_id ON command_responses(command_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_vehicle_commands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehicle_commands_updated_at
  BEFORE UPDATE ON vehicle_commands
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_commands_updated_at();

-- RLS (Row Level Security)
ALTER TABLE vehicle_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_responses ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own vehicle commands" ON vehicle_commands
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create commands for their vehicles" ON vehicle_commands
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own commands" ON vehicle_commands
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view confirmations for their commands" ON command_confirmations
  FOR SELECT USING (
    command_id IN (SELECT id FROM vehicle_commands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create confirmations for their commands" ON command_confirmations
  FOR INSERT WITH CHECK (
    confirmed_by = auth.uid() AND
    command_id IN (SELECT id FROM vehicle_commands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view responses for their commands" ON command_responses
  FOR SELECT USING (
    command_id IN (SELECT id FROM vehicle_commands WHERE user_id = auth.uid())
  );

-- Função para gerar token de confirmação
CREATE OR REPLACE FUNCTION generate_confirmation_token()
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Função para expirar comandos antigos
CREATE OR REPLACE FUNCTION expire_old_commands()
RETURNS void AS $$
BEGIN
  UPDATE vehicle_commands 
  SET status = 'expired'
  WHERE status = 'pending_confirmation' 
    AND confirmation_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE vehicle_commands IS 'Comandos remotos enviados para veículos';
COMMENT ON TABLE command_confirmations IS 'Confirmações de comandos pelos usuários';
COMMENT ON TABLE command_responses IS 'Respostas dos dispositivos aos comandos';
COMMENT ON COLUMN vehicle_commands.confirmation_required IS 'Se true, comando requer confirmação dupla';
COMMENT ON COLUMN vehicle_commands.confirmation_token IS 'Token único para confirmação do comando';
COMMENT ON COLUMN vehicle_commands.metadata IS 'Dados adicionais específicos do comando';