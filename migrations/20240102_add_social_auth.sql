-- Migração para autenticação social
-- Arquivo: 20240102_add_social_auth.sql

-- Enum para provedores sociais
CREATE TYPE social_provider AS ENUM ('google', 'facebook', 'apple');

-- Tabela para contas sociais vinculadas
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider social_provider NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_primary BOOLEAN DEFAULT FALSE,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(provider, provider_id),
    UNIQUE(user_id, provider) -- Um usuário pode ter apenas uma conta por provedor
);

-- Tabela para configurações de provedores sociais
CREATE TABLE IF NOT EXISTS social_providers_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider social_provider NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT FALSE,
    client_id VARCHAR(255),
    client_secret TEXT, -- Criptografado
    additional_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para logs de autenticação social
CREATE TABLE IF NOT EXISTS social_auth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider social_provider NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'login', 'signup', 'link', 'unlink'
    success BOOLEAN NOT NULL,
    error_code VARCHAR(100),
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_provider_id ON social_accounts(provider, provider_id);
CREATE INDEX idx_social_accounts_email ON social_accounts(email);
CREATE INDEX idx_social_auth_logs_user_id ON social_auth_logs(user_id);
CREATE INDEX idx_social_auth_logs_created_at ON social_auth_logs(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_social_accounts_updated_at
    BEFORE UPDATE ON social_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER trigger_social_providers_config_updated_at
    BEFORE UPDATE ON social_providers_config
    FOR EACH ROW
    EXECUTE FUNCTION update_social_updated_at();

-- Row Level Security (RLS)
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_auth_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para social_accounts
CREATE POLICY "Users can view their own social accounts" ON social_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts" ON social_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts" ON social_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts" ON social_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para social_auth_logs
CREATE POLICY "Users can view their own auth logs" ON social_auth_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Função para verificar se email já existe
CREATE OR REPLACE FUNCTION check_social_email_exists(p_email VARCHAR, p_provider social_provider, p_provider_id VARCHAR)
RETURNS TABLE(
    exists_in_auth BOOLEAN,
    exists_in_social BOOLEAN,
    user_id UUID,
    can_link BOOLEAN
) AS $$
DECLARE
    auth_user_id UUID;
    social_user_id UUID;
BEGIN
    -- Verificar se email existe na tabela auth.users
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = p_email;
    
    -- Verificar se combinação provider/provider_id já existe
    SELECT user_id INTO social_user_id 
    FROM social_accounts 
    WHERE provider = p_provider AND provider_id = p_provider_id;
    
    RETURN QUERY SELECT 
        auth_user_id IS NOT NULL,
        social_user_id IS NOT NULL,
        COALESCE(social_user_id, auth_user_id),
        (auth_user_id IS NOT NULL AND social_user_id IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_social_tokens()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE social_accounts 
    SET 
        access_token = NULL,
        refresh_token = NULL
    WHERE 
        token_expires_at IS NOT NULL 
        AND token_expires_at < NOW()
        AND (access_token IS NOT NULL OR refresh_token IS NOT NULL);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO social_auth_logs (
        provider, 
        action, 
        success, 
        error_message
    ) VALUES (
        'google', -- Placeholder, pois é obrigatório
        'cleanup',
        TRUE,
        'Cleaned ' || cleaned_count || ' expired tokens'
    );
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir configurações padrão dos provedores
INSERT INTO social_providers_config (provider, enabled, additional_config) VALUES
    ('google', FALSE, '{"scopes": ["email", "profile"]}'),
    ('facebook', FALSE, '{"scopes": ["email", "public_profile"]}'),
    ('apple', FALSE, '{"scopes": ["email", "name"]}')
ON CONFLICT (provider) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE social_accounts IS 'Contas sociais vinculadas aos usuários';
COMMENT ON TABLE social_providers_config IS 'Configurações dos provedores de autenticação social';
COMMENT ON TABLE social_auth_logs IS 'Logs de atividades de autenticação social';
COMMENT ON FUNCTION check_social_email_exists IS 'Verifica se email existe e se conta pode ser vinculada';
COMMENT ON FUNCTION cleanup_expired_social_tokens IS 'Remove tokens de acesso expirados';