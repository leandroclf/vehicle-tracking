"use client";

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
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Variáveis de ambiente do Supabase não configuradas');
      return;
    }
    
    // Inicialização simplificada
    console.log('Verificando configuração do banco de dados...');
    console.log('Verificação concluída');
    
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
  }
} 