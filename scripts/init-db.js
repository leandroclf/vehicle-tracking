require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não está definido');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Função para recriar usuários de teste
async function resetUsersPasswords() {
  try {
    console.log('Atualizando senhas de usuários...');
    
    // Verificar usuários existentes
    const usersResult = await pool.query('SELECT * FROM users WHERE email IN ($1, $2)', ['admin@yukz.com', 'teste@yukz.com']);
    
    const adminUser = usersResult.rows.find(user => user.email === 'admin@yukz.com');
    const testUser = usersResult.rows.find(user => user.email === 'teste@yukz.com');
    
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
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      try {
        await pool.query(
          'UPDATE users SET password_hash = $1, email_verified = true WHERE id = $2',
          [hashedPassword, adminUser.id]
        );
        console.log('Administrador atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar administrador:', error);
      }
    }
    
    // Resetar senha do usuário teste
    if (testUser) {
      console.log(`Atualizando usuário teste: ${testUser.id}`);
      
      const hashedPassword = await bcrypt.hash('teste123', 10);
      
      try {
        await pool.query(
          'UPDATE users SET password_hash = $1, email_verified = true WHERE id = $2',
          [hashedPassword, testUser.id]
        );
        console.log('Usuário teste atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar usuário teste:', error);
      }
    }
    
    // Atualizar metadados dos usuários
    if (adminUser) {
      try {
        await pool.query(
          'UPDATE users SET name = $1, role = $2 WHERE id = $3',
          ['Administrador', 'admin', adminUser.id]
        );
      } catch (error) {
        console.error('Erro ao atualizar metadados do admin:', error);
      }
    }
    
    if (testUser) {
      try {
        await pool.query(
          'UPDATE users SET name = $1, role = $2 WHERE id = $3',
          ['Usuário Teste', 'user', testUser.id]
        );
      } catch (error) {
        console.error('Erro ao atualizar metadados do usuário teste:', error);
      }
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
    const testUserId = uuidv4();
    const testPasswordHash = await bcrypt.hash('teste123', 10);
    
    try {
      await pool.query(
        'INSERT INTO users (id, email, password_hash, name, role, email_verified, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [testUserId, 'teste@yukz.com', testPasswordHash, 'Usuário Teste', 'user', true, new Date()]
      );
      console.log('Usuário padrão criado com sucesso');
    } catch (error) {
      console.error(`Erro ao criar usuário padrão: ${error.message}`);
    }
    
    // 2. Criar usuário administrador
    const adminUserId = uuidv4();
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    
    try {
      await pool.query(
        'INSERT INTO users (id, email, password_hash, name, role, email_verified, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [adminUserId, 'admin@yukz.com', adminPasswordHash, 'Administrador', 'admin', true, new Date()]
      );
      console.log('Usuário administrador criado com sucesso');
    } catch (error) {
      console.error(`Erro ao criar usuário administrador: ${error.message}`);
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
    const usersResult = await pool.query('SELECT id, email, name FROM users');
    
    // Verificar perfis existentes
    const profilesResult = await pool.query('SELECT user_id FROM profiles');
    
    // Conjunto de IDs de perfis existentes
    const existingProfileIds = new Set(profilesResult.rows.map(p => p.user_id) || []);
    
    // Para cada usuário, criar perfil se não existir
    for (const user of usersResult.rows) {
      if (!existingProfileIds.has(user.id)) {
        console.log(`Criando perfil para usuário ${user.email}`);
        
        try {
          await pool.query(
            'INSERT INTO profiles (id, user_id, name, created_at) VALUES ($1, $2, $3, $4)',
            [uuidv4(), user.id, user.name || 'Novo Usuário', new Date()]
          );
        } catch (error) {
          console.error(`Erro ao criar perfil para ${user.email}:`, error);
        }
      }
    }
    
    console.log('Perfis sincronizados com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar perfis:', error);
    return false;
  }
}

// Executar a função principal
if (require.main === module) {
  resetUsersPasswords()
    .then(success => {
      if (success) {
        console.log('\n✅ Inicialização concluída com sucesso!');
        console.log('\n📋 Credenciais de acesso:');
        console.log('👤 Admin: admin@yukz.com / admin123');
        console.log('👤 Teste: teste@yukz.com / teste123');
        console.log('\n🚀 Execute: npm run dev');
      } else {
        console.log('\n❌ Falha na inicialização');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}