import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAuth, validateBody, validateQuery, respondWithError, buildPaginatedQuery } from '@/lib/api-utils';

// Interface para a estrutura de alerta vinda do banco
interface Alert {
  id: number;
  user_id: string;
  vehicle_id: number;
  message: string;
  type: string;
  timestamp: string;
  read: boolean;
  vehicles?: {
    name: string;
  };
}

// Esquema para validação de parâmetros de consulta
const querySchema = z.object({
  limit: z.coerce.number().optional().default(50),
  offset: z.coerce.number().optional().default(0),
  read: z.union([
    z.literal('true').transform(() => true),
    z.literal('false').transform(() => false),
    z.string().optional().transform(() => undefined)
  ]).optional(),
  vehicle_id: z.coerce.number().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc')
});

// Esquema para validação do corpo da requisição ao marcar alertas como lidos
const markReadSchema = z.object({
  alertIds: z.array(z.number().int().positive()).min(1, "Pelo menos um ID de alerta é necessário"),
});

// Handler para obter alertas (GET)
export const GET = withApiAuth(async (req, { user, supabase }) => {
  // Validar parâmetros de consulta
  const queryResult = validateQuery(req, querySchema);
  if (queryResult.error) {
    return respondWithError(queryResult.error);
  }

  const { limit, offset, read, vehicle_id, sort } = queryResult.data!;

  // Construir filtros opcionais
  const filter: Record<string, any> = {};
  if (read !== undefined) filter.read = read;
  if (vehicle_id) filter.vehicle_id = vehicle_id;

  // Construir consulta paginada
  const query = buildPaginatedQuery(
    supabase,
    'alerts',
    user.id,
    {
      limit,
      offset,
      orderBy: 'timestamp',
      ascending: sort === 'asc',
      filter,
      select: `
        *,
        vehicles (name)
      `
    }
  );

  // Executar consulta
  const { data: alerts, error, count } = await query;

  if (error) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 });
  }

  // Formatar os dados para manter compatibilidade
  const formattedAlerts = (alerts as Alert[] || []).map(alert => ({
    ...alert,
    vehicleName: alert.vehicles?.name || 'Desconhecido',
    read: Boolean(alert.read)
  }));

  return NextResponse.json({
    alerts: formattedAlerts,
    pagination: {
      total: count || 0,
      limit,
      offset
    }
  });
});

// Handler para marcar alertas como lidos (PATCH)
export const PATCH = withApiAuth(async (req, { user, supabase }) => {
  // Validar corpo da requisição
  const bodyResult = await validateBody(req, markReadSchema);
  if (bodyResult.error) {
    return respondWithError(bodyResult.error);
  }

  const { alertIds } = bodyResult.data!;

  // Atualizar o status 'read' dos alertas especificados
  const { error } = await supabase
    .from('alerts')
    .update({ read: true })
    .in('id', alertIds)
    .eq('user_id', user.id);

  if (error) {
    console.error('Erro ao marcar alertas como lidos:', error);
    return NextResponse.json({ error: 'Erro ao marcar alertas como lidos' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    message: `${alertIds.length} alerta(s) marcado(s) como lido(s) com sucesso` 
  });
});

// Handler para marcar todos os alertas como lidos (PUT)
export const PUT = withApiAuth(async (req, { user, supabase }) => {
  // Atualizar todos os alertas não lidos do usuário
  const { error } = await supabase
    .from('alerts')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    console.error('Erro ao marcar todos os alertas como lidos:', error);
    return NextResponse.json({ error: 'Erro ao marcar todos os alertas como lidos' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    message: 'Todos os alertas foram marcados como lidos' 
  });
}); 