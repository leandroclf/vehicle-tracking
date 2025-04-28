import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

// Esquema para marcar alertas como lidos
const markReadSchema = z.object({
  alertIds: z.array(z.number().int().positive()).min(1, "Pelo menos um ID de alerta é necessário"),
});

// Criar cliente Supabase
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Credenciais do Supabase não encontradas');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Handler para listar alertas (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    const userId = authResult.user.id;

    const supabase = getSupabaseClient();
    
    // Buscar alertas do usuário, ordenados por data decrescente
    // Incluir nome do veículo se disponível
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        *,
        vehicles (name)
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
      
    if (error) throw error;

    // Formatar os dados para manter compatibilidade
    const formattedAlerts = alerts?.map(alert => ({
      ...alert,
      vehicleName: alert.vehicles?.name,
      read: Boolean(alert.read)
    })) || [];

    return NextResponse.json(formattedAlerts, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para marcar alertas como lidos (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    const userId = authResult.user.id;

    // Obter e validar os IDs dos alertas a serem marcados como lidos
    const body = await request.json();
    const result = markReadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 });
    }
    const { alertIds } = result.data;

    const supabase = getSupabaseClient();
    
    // Atualizar o status 'read' dos alertas especificados para o usuário
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .in('id', alertIds)
      .eq('user_id', userId);
      
    if (error) throw error;

    return NextResponse.json({ message: `Alerta(s) marcado(s) como lido(s) com sucesso` }, { status: 200 });

  } catch (error) {
    console.error('Erro ao marcar alertas como lidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para marcar TODOS os alertas como lidos (PUT - usando PUT para diferenciar do PATCH)
export async function PUT(request: NextRequest) {
    try {
      // Verificar autenticação do usuário
      const authResult = await verifyAuth(request);
      if (!authResult.user) {
        return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
      }
      const userId = authResult.user.id;
      
      const supabase = getSupabaseClient();
      
      // Atualizar o status 'read' de TODOS os alertas do usuário
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
        
      if (error) throw error;
  
      return NextResponse.json({ message: `Todos os alertas foram marcados como lidos` }, { status: 200 });
  
    } catch (error) {
      console.error('Erro ao marcar todos os alertas como lidos:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }

