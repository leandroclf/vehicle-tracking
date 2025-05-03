import { getAdminClient } from './databaseConfig';
import fs from 'fs';
import path from 'path';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Inicializa o banco de dados aplicando as migrações necessárias
 */
export async function initializeDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
    const admin = getAdminClient();
    
    // Verifica se o banco já foi inicializado tentando usar a função "pgexec"
    console.log('Verificando estado atual do banco de dados...');
    
    const { data: dbInfo, error: dbError } = await admin.rpc('pgexec', { 
      sql: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles');"
    });
    
    if (dbError) {
      if (dbError.message.includes('function "pgexec" does not exist')) {
        // Precisamos criar a função pgexec primeiro
        console.log('Função pgexec não existe, criando...');
        
        const createPgexecQuery = `
          CREATE OR REPLACE FUNCTION pgexec(sql text) RETURNS json AS $$
          DECLARE
            result json;
          BEGIN
            EXECUTE sql;
            result := json_build_object('success', true);
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            result := json_build_object('success', false, 'error', SQLERRM);
            RETURN result;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        
        const { error: createFnError } = await admin.rpc('pg_execute', { query: createPgexecQuery });
        
        if (createFnError) {
          console.log('Não foi possível criar a função pgexec, tentando criar tabelas diretamente...');
          await applyMigrationDirectly(admin);
          return true;
        }
      } else {
        console.log(`Erro ao verificar estado do banco: ${dbError.message}`);
        // Tenta aplicar as migrações mesmo assim
        await applyMigrationDirectly(admin);
        return true;
      }
    }
    
    // Se chegamos aqui e profiles existe, o banco já está inicializado
    if (dbInfo && dbInfo.success && dbInfo.exists) {
      console.log('Banco de dados já inicializado');
      return true;
    }
    
    // Aplica o script de migração
    console.log('Aplicando migrações...');
    
    await applyMigrationDirectly(admin);
    
    console.log('Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Falha ao inicializar o banco de dados:', error);
    throw error;
  }
}

/**
 * Aplica a migração diretamente usando instruções SQL individuais
 */
async function applyMigrationDirectly(admin: SupabaseClient) {
  try {
    // Define os possíveis caminhos para o arquivo de migração (desenvolvimento e produção)
    const possiblePaths = [
      path.join(process.cwd(), 'migrations', '20250427221812_initial_schema.sql'),
      path.resolve(__dirname, '../..', 'migrations', '20250427221812_initial_schema.sql'),
      path.resolve(__dirname, '../../..', 'migrations', '20250427221812_initial_schema.sql')
    ];
    
    let migrationPath = '';
    
    // Tenta encontrar o arquivo em um dos possíveis caminhos
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        migrationPath = possiblePath;
        console.log(`Arquivo de migração encontrado em: ${migrationPath}`);
        break;
      }
    }
    
    if (!migrationPath) {
      // Se não encontrar o arquivo, use as tabelas existentes no MCP Supabase
      console.log('Arquivo de migração não encontrado, usando tabelas existentes...');
      await createBasicTables(admin);
      return true;
    }
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir o script em comandos SQL separados por ';'
    const sqlCommands = migrationSql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);
    
    console.log(`Aplicando ${sqlCommands.length} comandos SQL...`);
    
    // Executa cada comando separadamente
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      
      // Pula comentários
      if (sql.startsWith('--')) continue;
      
      try {
        const { error } = await admin.rpc('pg_execute', { query: sql });
        
        if (error) {
          console.warn(`Aviso: Comando ${i+1} falhou: ${error.message.substring(0, 100)}...`);
          // Continua para o próximo comando mesmo com falha
        }
      } catch (cmdError: unknown) {
        const errorMessage = cmdError instanceof Error ? cmdError.message : String(cmdError);
        console.warn(`Aviso: Erro ao executar comando ${i+1}: ${errorMessage.substring(0, 100)}...`);
        // Continua para o próximo comando mesmo com falha
      }
    }
    
    // Verificação final
    const requiredTables = [
      'profiles', 
      'vehicles', 
      'vehicle_status', 
      'trips', 
      'events', 
      'alerts', 
      'settings', 
      'geofences'
    ];
    
    let missingTables = [];
    
    // Tentamos consultar cada tabela para verificar se existe
    for (const table of requiredTables) {
      const { error } = await admin.from(table).select('id').limit(1);
      if (error && error.message.includes(`relation "${table}" does not exist`)) {
        missingTables.push(table);
      }
    }
    
    if (missingTables.length > 0) {
      throw new Error(`Algumas tabelas não foram criadas: ${missingTables.join(', ')}`);
    }
    
    console.log('Migração aplicada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro durante aplicação direta da migração:', error);
    throw error;
  }
}

/**
 * Cria as tabelas básicas necessárias diretamente
 */
async function createBasicTables(admin: SupabaseClient) {
  try {
    console.log('Criando tabelas básicas via SQL direto...');
    
    // Criação da tabela profiles
    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone." 
        ON public.profiles FOR SELECT USING (true);
      CREATE POLICY IF NOT EXISTS "Users can insert their own profile." 
        ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
      CREATE POLICY IF NOT EXISTS "Users can update own profile." 
        ON public.profiles FOR UPDATE USING (auth.uid() = id);
    `;
    
    try {
      await admin.rpc('pg_execute', { query: createProfilesTable });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('Erro ao criar tabela profiles:', message);
    }
    
    // Criação da tabela settings
    const createSettingsTable = `
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
      
      ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "Users can manage their own settings." 
        ON public.settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    `;
    
    try {
      await admin.rpc('pg_execute', { query: createSettingsTable });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('Erro ao criar tabela settings:', message);
    }
    
    // Criação da trigger para criar settings automaticamente
    const createProfileTrigger = `
      CREATE OR REPLACE FUNCTION public.handle_new_profile()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.settings (user_id)
        VALUES (new.id);
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
      CREATE TRIGGER on_profile_created
        AFTER INSERT ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
    `;
    
    try {
      await admin.rpc('pg_execute', { query: createProfileTrigger });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('Erro ao criar trigger handle_new_profile:', message);
    }
    
    // Criação da função para criar perfil ao inserir usuário
    const createUserTrigger = `
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, name)
        VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'New User'))
        ON CONFLICT (id) DO NOTHING;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    try {
      await admin.rpc('pg_execute', { query: createUserTrigger });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('Erro ao criar trigger handle_new_user:', message);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao criar tabelas básicas:', error);
    throw error;
  }
}

/**
 * Cria tabelas de teste para ambiente de desenvolvimento
 */
export async function seedTestData() {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    console.log(`Ignorando seed de dados em ambiente ${process.env.NODE_ENV}`);
    return;
  }
  
  try {
    console.log('Criando dados de teste...');
    
    const admin = getAdminClient();
    
    // Verificar se já existem usuários de teste via API de auth
    console.log('Verificando se usuários de teste já existem');
    const { data, error } = await admin.auth.admin.listUsers();
    
    if (error) {
      console.error('Erro ao listar usuários existentes:', error);
      return false;
    }
    
    // Verificar se o usuário administrador já existe
    const adminExists = data?.users?.some(user => user.email === 'admin@yukz.com');
    
    if (adminExists) {
      console.log('Dados de teste já existem, pulando seed');
      return true;
    }
    
    console.log('Criando usuários de teste...');
    
    // 1. Criar usuário padrão
    const { data: userPadrao, error: errorPadrao } = await admin
      .auth.admin.createUser({
        email: 'teste@yukz.com',
        password: 'teste123',
        email_confirm: true,
        user_metadata: {
          name: 'Usuário Teste',
          type: 'individual'
        }
      });
    
    if (errorPadrao) {
      throw new Error(`Erro ao criar usuário padrão: ${errorPadrao.message}`);
    }
    
    console.log('Usuário padrão criado com sucesso');
    
    // 2. Criar usuário administrador
    const { data: userAdmin, error: errorAdmin } = await admin
      .auth.admin.createUser({
        email: 'admin@yukz.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          name: 'Administrador',
          type: 'large_fleet'
        }
      });
    
    if (errorAdmin) {
      throw new Error(`Erro ao criar usuário administrador: ${errorAdmin.message}`);
    }
    
    console.log('Usuário administrador criado com sucesso');
    
    // Criar veículo de demonstração para o administrador
    const { data: vehicle, error: vehicleError } = await admin
      .from('vehicles')
      .insert({
        user_id: userAdmin.user.id,
        name: 'Carro Demonstração',
        type: 'car',
        plate: 'ABC1234',
        model: 'Toyota Corolla',
        year: '2023',
        color: 'Prata'
      })
      .select()
      .single();
    
    if (vehicleError) {
      throw new Error(`Erro ao criar veículo de demonstração: ${vehicleError.message}`);
    }
    
    // Configurar rastreador para o veículo
    const { error: trackerError } = await admin
      .from('trackers')
      .insert({
        vehicle_id: vehicle.id,
        imei: '123456789012345',
        protocol: 'teltonika',
        status: 'active'
      });
      
    if (trackerError) {
      throw new Error(`Erro ao criar rastreador: ${trackerError.message}`);
    }
    
    // Criar status inicial do veículo
    const { error: statusError } = await admin
      .from('vehicle_status')
      .insert({
        vehicle_id: vehicle.id,
        status: 'online',
        is_moving: false,
        last_update: new Date().toISOString(),
        lat: -23.550520,
        lng: -46.633308,
        address: 'Centro de São Paulo',
        speed: 0,
        direction: 'Norte',
        ignition: false,
        battery: 95,
        satellites: 9
      });
    
    if (statusError) {
      throw new Error(`Erro ao criar status do veículo: ${statusError.message}`);
    }
    
    console.log('Dados de teste criados com sucesso!');
    return true;
  } catch (error) {
    console.error('Falha ao criar dados de teste:', error);
    return false;
  }
} 