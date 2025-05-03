const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zktyautduranjobylpkb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY não está definido');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para criar dados de teste
async function seedTestData() {
  try {
    console.log('Criando dados de teste...');
    
    // Verificar se já existem usuários de teste
    console.log('Verificando se usuários de teste já existem');
    const { data, error } = await admin.auth.admin.listUsers();
    
    if (error) {
      console.error('Erro ao listar usuários existentes:', error);
      return false;
    }
    
    // Verificar se os usuários já existem
    const testeExists = data?.users?.some(user => user.email === 'teste@yukz.com');
    const adminExists = data?.users?.some(user => user.email === 'admin@yukz.com');
    
    if (testeExists && adminExists) {
      console.log('Usuários de teste já existem, pulando criação');
      console.log('Execute o comando: npm run dev');
      return true;
    }
    
    console.log('Criando usuários de teste...');
    
    // 1. Criar usuário padrão
    if (!testeExists) {
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
        console.error(`Erro ao criar usuário padrão: ${errorPadrao.message}`);
      } else {
        console.log('Usuário padrão criado com sucesso');
      }
    }
    
    // 2. Criar usuário administrador
    if (!adminExists) {
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
        console.error(`Erro ao criar usuário administrador: ${errorAdmin.message}`);
      } else {
        console.log('Usuário administrador criado com sucesso');
      }
    }
    
    console.log('Usuários criados com sucesso!');
    console.log('Execute o comando: npm run dev');
    return true;
  } catch (error) {
    console.error('Falha ao criar dados de teste:', error);
    return false;
  }
}

// Executar o código
seedTestData().catch(console.error); 