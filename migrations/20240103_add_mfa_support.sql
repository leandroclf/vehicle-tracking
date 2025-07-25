-- Migração para adicionar suporte a MFA (Multi-Factor Authentication)
-- Data: 2024-12-XX

-- Tabela para configurações MFA do usuário
CREATE TABLE IF NOT EXISTS user_mfa_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  
  -- SMS MFA
  sms_enabled BOOLEAN DEFAULT false,
  sms_phone VARCHAR(20),
  
  -- TOTP MFA (Google Authenticator)
  totp_enabled BOOLEAN DEFAULT false,
  totp_secret VARCHAR(100),
  
  -- Email MFA
  email_enabled BOOLEAN DEFAULT false,
  email_address VARCHAR(255),
  
  -- Códigos de backup
  backup_codes JSONB,
  backup_codes_count INTEGER DEFAULT 0,
  backup_codes_last_used TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Tabela para configurações temporárias durante setup MFA
CREATE TABLE IF NOT EXISTS mfa_setup_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL, -- 'sms', 'totp', 'email'
  
  -- Dados temporários
  phone VARCHAR(20),
  email VARCHAR(255),
  secret VARCHAR(100),
  verification_code VARCHAR(10),
  backup_codes JSONB,
  
  -- Expiração
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para sessões MFA
CREATE TABLE IF NOT EXISTS mfa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para logs de tentativas MFA
CREATE TABLE IF NOT EXISTS mfa_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_config_user_id ON user_mfa_config(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_setup_temp_user_id ON mfa_setup_temp(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_setup_temp_expires ON mfa_setup_temp(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_user_id ON mfa_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_expires ON mfa_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user_id ON mfa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_created ON mfa_attempts(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_mfa_config_updated_at 
  BEFORE UPDATE ON user_mfa_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar dados temporários expirados
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_data()
RETURNS void AS $$
BEGIN
  -- Limpar configurações temporárias expiradas
  DELETE FROM mfa_setup_temp WHERE expires_at < NOW();
  
  -- Limpar sessões MFA expiradas
  DELETE FROM mfa_sessions WHERE expires_at < NOW();
  
  -- Limpar logs antigos (manter apenas 90 dias)
  DELETE FROM mfa_attempts WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se MFA é obrigatório para o usuário
CREATE OR REPLACE FUNCTION is_mfa_required(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  mfa_enabled BOOLEAN;
BEGIN
  -- Verificar se o usuário é admin
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Verificar se MFA está habilitado
  SELECT enabled INTO mfa_enabled FROM user_mfa_config WHERE user_id = user_id;
  
  -- MFA obrigatório para admins ou se já estiver habilitado
  RETURN (user_role = 'admin' OR COALESCE(mfa_enabled, false));
END;
$$ LANGUAGE plpgsql;

-- Função para criar sessão MFA
CREATE OR REPLACE FUNCTION create_mfa_session(
  p_user_id UUID,
  p_provider VARCHAR(20),
  p_expires_minutes INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO mfa_sessions (user_id, provider, expires_at)
  VALUES (p_user_id, p_provider, NOW() + (p_expires_minutes || ' minutes')::INTERVAL)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE user_mfa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_setup_temp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver apenas suas configurações MFA" ON user_mfa_config
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver apenas seus setups temporários" ON mfa_setup_temp
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver apenas suas sessões MFA" ON mfa_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver apenas suas tentativas MFA" ON mfa_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE user_mfa_config IS 'Configurações de autenticação multifatorial por usuário';
COMMENT ON TABLE mfa_setup_temp IS 'Dados temporários durante configuração MFA';
COMMENT ON TABLE mfa_sessions IS 'Sessões ativas de autenticação MFA';
COMMENT ON TABLE mfa_attempts IS 'Log de tentativas de autenticação MFA';

COMMENT ON FUNCTION cleanup_expired_mfa_data IS 'Remove dados MFA expirados';
COMMENT ON FUNCTION is_mfa_required IS 'Verifica se MFA é obrigatório para o usuário';
COMMENT ON FUNCTION create_mfa_session IS 'Cria nova sessão MFA';