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

// Função para recriar usuários de teste
async function resetUsersPasswords() {
  try {
    console.log('Atualizando senhas de usuários...');
    
    // Verificar usuários existentes
    const { data: users, error: usersError } = await admin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Erro ao listar usuários:', usersError);
      return false;
    }
    
    // Encontrar usuários por email
    const adminUser = users.users.find(user => user.email === 'admin@yukz.com');
    const testUser = users.users.find(user => user.email === 'teste@yukz.com');
    
    if (!adminUser && !testUser) {
      console.log('Nenhum usuário encontrado para atualizar');
      
      // Criar usuários se não existirem
      console.log('Criando usuários...');
      await createUsers();
      return;
    }
    
    // Resetar senha do usuário administrador
    if (adminUser) {
      console.log(`Atualizando usuário admin: ${adminUser.id}`);
      
      const { error: updateAdminError } = await admin.auth.admin.updateUserById(
        adminUser.id,
        { 
          password: 'admin123',
          email_confirm: true
        }
      );
      
      if (updateAdminError) {
        console.error('Erro ao atualizar administrador:', updateAdminError);
      } else {
        console.log('Administrador atualizado com sucesso!');
      }
    }
    
    // Resetar senha do usuário teste
    if (testUser) {
      console.log(`Atualizando usuário teste: ${testUser.id}`);
      
      const { error: updateTestError } = await admin.auth.admin.updateUserById(
        testUser.id,
        { 
          password: 'teste123',
          email_confirm: true
        }
      );
      
      if (updateTestError) {
        console.error('Erro ao atualizar usuário teste:', updateTestError);
      } else {
        console.log('Usuário teste atualizado com sucesso!');
      }
    }
    
    // Atualizar metadados dos usuários
    if (adminUser) {
      await admin.auth.admin.updateUserById(
        adminUser.id,
        {
          user_metadata: {
            name: 'Administrador',
            type: 'large_fleet'
          }
        }
      );
    }
    
    if (testUser) {
      await admin.auth.admin.updateUserById(
        testUser.id,
        {
          user_metadata: {
            name: 'Usuário Teste',
            type: 'individual'
          }
        }
      );
    }
    
    // Sincronizar perfis
    await syncProfiles();
    
    console.log('Usuários atualizados com sucesso!');
    console.log('Agora você pode executar: npm run dev');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar usuários:', error);
    return false;
  }
}

// Função para criar usuários do zero
async function createUsers() {
  try {
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
      console.error(`Erro ao criar usuário padrão: ${errorPadrao.message}`);
    } else {
      console.log('Usuário padrão criado com sucesso');
    }
    
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
      console.error(`Erro ao criar usuário administrador: ${errorAdmin.message}`);
    } else {
      console.log('Usuário administrador criado com sucesso');
    }
    
    // Sincronizar perfis
    await syncProfiles();
    
    console.log('Usuários criados com sucesso!');
    console.log('Execute o comando: npm run dev');
    return true;
  } catch (error) {
    console.error('Falha ao criar usuários:', error);
    return false;
  }
}

// Função para sincronizar os perfis dos usuários
async function syncProfiles() {
  try {
    // Verificar usuários existentes
    const { data: users } = await admin.auth.admin.listUsers();
    
    // Verificar perfis existentes
    const { data: profiles } = await admin.from('profiles').select('id');
    
    // Conjunto de IDs de perfis existentes
    const existingProfileIds = new Set(profiles?.map(p => p.id) || []);
    
    // Para cada usuário, criar perfil se não existir
    for (const user of users.users) {
      if (!existingProfileIds.has(user.id)) {
        console.log(`Criando perfil para usuário ${user.email}`);
        
        await admin.from('profiles').insert({
          id: user.id,
          name: user.user_metadata?.name || 'Novo Usuário'
        });
      }
    }
    
    console.log('Perfis sincronizados com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar perfis:', error);
    return false;
  }
}

// Executar o código
resetUsersPasswords().catch(console.error); 