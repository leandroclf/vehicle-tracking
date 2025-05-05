-- Função que verifica se uma tabela existe no schema public
CREATE OR REPLACE FUNCTION public.table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Conceder permissão para todas as funções de verificação
GRANT EXECUTE ON FUNCTION public.table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.table_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.table_exists(text) TO service_role;

-- Função para criar a tabela de notificações
CREATE OR REPLACE FUNCTION public.create_notifications_table()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se a tabela já existe
  IF public.table_exists('notifications') THEN
    RETURN true;
  END IF;
  
  -- Criar a tabela notifications
  CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  );
  
  -- Adicionar políticas RLS para a tabela
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  
  -- Política para permitir leitura e atualização apenas do próprio usuário
  CREATE POLICY "Usuários podem ver suas próprias notificações" 
    ON public.notifications 
    FOR SELECT 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Usuários podem atualizar suas próprias notificações" 
    ON public.notifications 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  
  -- Permitir que o service role acesse tudo
  CREATE POLICY "Service role pode fazer tudo" 
    ON public.notifications 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  
  -- Criação de índices para melhorar performance
  CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
  CREATE INDEX idx_notifications_timestamp ON public.notifications(timestamp);
  CREATE INDEX idx_notifications_read ON public.notifications(read);
  
  RETURN true;
END;
$$;

-- Conceder permissões para criar tabelas
GRANT EXECUTE ON FUNCTION public.create_notifications_table() TO service_role;

-- Função para criar a tabela de alertas
CREATE OR REPLACE FUNCTION public.create_alerts_table()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se a tabela já existe
  IF public.table_exists('alerts') THEN
    RETURN true;
  END IF;
  
  -- Criar a tabela alerts
  CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    vehicle_id UUID,
    type TEXT NOT NULL DEFAULT 'generic',
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    data JSONB,
    read BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT now(),
    location GEOMETRY(POINT, 4326),
    
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  );
  
  -- Adicionar políticas RLS para a tabela
  ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
  
  -- Política para permitir leitura e atualização apenas do próprio usuário
  CREATE POLICY "Usuários podem ver seus próprios alertas" 
    ON public.alerts 
    FOR SELECT 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Usuários podem atualizar seus próprios alertas" 
    ON public.alerts 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  
  -- Permitir que o service role acesse tudo
  CREATE POLICY "Service role pode fazer tudo com alertas" 
    ON public.alerts 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  
  -- Criação de índices para melhorar performance
  CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
  CREATE INDEX idx_alerts_vehicle_id ON public.alerts(vehicle_id);
  CREATE INDEX idx_alerts_timestamp ON public.alerts(timestamp);
  CREATE INDEX idx_alerts_read ON public.alerts(read);
  CREATE INDEX idx_alerts_location ON public.alerts USING GIST(location);
  
  RETURN true;
END;
$$;

-- Conceder permissões para criar tabelas
GRANT EXECUTE ON FUNCTION public.create_alerts_table() TO service_role; 