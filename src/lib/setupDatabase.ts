import { initializeDatabase, seedTestData } from './initDatabase';

/**
 * Configura o banco de dados na inicialização da aplicação
 * Esta função é chamada no arquivo app/api/route.ts
 */
export async function setupDatabase() {
  try {
    // Verifica se estamos em um ambiente de servidor
    if (typeof window !== 'undefined') {
      console.log('setupDatabase ignorado no cliente');
      return;
    }
    
    // Verifica se o ambiente está configurado corretamente
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Variáveis de ambiente do Supabase não configuradas');
      return;
    }
    
    // Inicializa o banco de dados (aplica migrações se necessário)
    await initializeDatabase();
    
    // Tentar criar dados de teste sempre, independente do ambiente
    // Isso garante que os usuários de teste estejam disponíveis
    console.log('Garantindo criação dos usuários de teste...');
    
    try {
      await seedTestData();
      console.log('Usuários de teste verificados com sucesso');
    } catch (seedError) {
      console.warn('Aviso: Falha ao criar usuários de teste:', seedError);
      // Continua a execução mesmo com falha no seed
    }
    
    console.log('Configuração do banco de dados concluída com sucesso');
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
  }
} 