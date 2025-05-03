import { getAdminClient } from './databaseConfig';
import fs from 'fs';
import path from 'path';

/**
 * Inicializa o banco de dados aplicando as migrações necessárias
 */
export async function initializeDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
    const admin = getAdminClient();
    
    // Verifica se o banco já foi inicializado
    const { data: tableInfo, error: tableError } = await admin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
    
    if (tableError) {
      throw new Error(`Erro ao verificar tabelas: ${tableError.message}`);
    }
    
    // Se a tabela profiles já existir, considera que o banco já está inicializado
    if (tableInfo && tableInfo.length > 0) {
      console.log('Banco de dados já inicializado');
      return true;
    }
    
    // Aplica o script de migração
    console.log('Aplicando migrações...');
    
    // Lê o arquivo de migração
    const migrationPath = path.join(process.cwd(), 'migrations', '20250427221812_initial_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationPath}`);
    }
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Executa o script SQL
    const { error: migrationError } = await admin.rpc('pgexec', { sql: migrationSql });
    
    if (migrationError) {
      throw new Error(`Erro ao aplicar migração: ${migrationError.message}`);
    }
    
    console.log('Migração aplicada com sucesso');
    
    // Verificação final
    const { data: finalCheck, error: finalError } = await admin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (finalError) {
      throw new Error(`Erro na verificação final: ${finalError.message}`);
    }
    
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
    
    const createdTables = finalCheck?.map(t => t.table_name) || [];
    const missing = requiredTables.filter(table => !createdTables.includes(table));
    
    if (missing.length > 0) {
      throw new Error(`Algumas tabelas não foram criadas: ${missing.join(', ')}`);
    }
    
    console.log('Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Falha ao inicializar o banco de dados:', error);
    throw error;
  }
}

/**
 * Cria tabelas de teste para ambiente de desenvolvimento
 */
export async function seedTestData() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Ignorando seed de dados em ambiente não-desenvolvimento');
    return;
  }
  
  try {
    console.log('Criando dados de teste...');
    
    const admin = getAdminClient();
    
    // Verificar se já existem usuários de teste
    const { data: existingUser, error: userError } = await admin
      .from('auth.users')
      .select('id')
      .eq('email', 'demo@yukz.com')
      .limit(1);
    
    if (userError) {
      console.error('Erro ao verificar usuário de teste:', userError);
      return;
    }
    
    if (existingUser && existingUser.length > 0) {
      console.log('Dados de teste já existem, pulando seed');
      return;
    }
    
    // Criar usuário de teste
    const { data: newUser, error: createError } = await admin
      .auth.admin.createUser({
        email: 'demo@yukz.com',
        password: 'demo123',
        user_metadata: {
          name: 'Usuário Demonstração'
        }
      });
    
    if (createError) {
      throw new Error(`Erro ao criar usuário de teste: ${createError.message}`);
    }
    
    const userId = newUser.user.id;
    
    // Criar veículo de teste
    const { data: vehicle, error: vehicleError } = await admin
      .from('vehicles')
      .insert({
        user_id: userId,
        name: 'Caminhão Demo',
        type: 'truck',
        plate: 'DEMO1234',
        model: 'Volvo FH 540',
        year: '2025',
        color: '#FF0000'
      })
      .select()
      .single();
    
    if (vehicleError) {
      throw new Error(`Erro ao criar veículo de teste: ${vehicleError.message}`);
    }
    
    // Criar status inicial do veículo
    const { error: statusError } = await admin
      .from('vehicle_status')
      .insert({
        vehicle_id: vehicle.id,
        status: 'online',
        is_moving: false,
        last_update: new Date().toISOString(),
        lat: -23.5505,
        lng: -46.6333,
        address: 'Av. Paulista, São Paulo',
        speed: 0,
        direction: 'Norte',
        ignition: false,
        battery: 95,
        satellites: 9
      });
    
    if (statusError) {
      throw new Error(`Erro ao criar status do veículo: ${statusError.message}`);
    }
    
    // Criar geocerca de teste
    const { error: geofenceError } = await admin
      .from('geofences')
      .insert({
        user_id: userId,
        name: 'Área Central',
        description: 'Região central da cidade',
        type: 'circle',
        coordinates: { 
          lat: -23.5505, 
          lng: -46.6333 
        },
        radius_meters: 5000,
        alert_on_enter: true,
        alert_on_exit: true
      });
    
    if (geofenceError) {
      throw new Error(`Erro ao criar geocerca de teste: ${geofenceError.message}`);
    }
    
    console.log('Dados de teste criados com sucesso!');
    return true;
  } catch (error) {
    console.error('Falha ao criar dados de teste:', error);
    return false;
  }
} 