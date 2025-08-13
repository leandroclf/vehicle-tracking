import { verifyAuth } from '@/lib/auth-middleware';
import { getConnection } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// Definir interface de tipos para a requisição
interface ReportRequest {
  reportType: string;
  startDate: string;
  endDate: string;
  vehicleIds: string[];
  format?: 'pdf' | 'excel';
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
  }
  try {
    const { 
      reportType, 
      startDate, 
      endDate, 
      vehicleIds,
      format = 'pdf'
    } = await request.json() as ReportRequest;
    
    // Validação básica
    if (!reportType || !startDate || !endDate || !vehicleIds || vehicleIds.length === 0) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Criar o registro do relatório
    // TODO: Implementar query SQL direta
    const client = await getConnection();
    const reportQuery = `
      INSERT INTO reports (
        user_id, report_type, start_date, end_date, vehicle_ids, format, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const reportResult = await client.query(reportQuery, [
      authResult.user.id,
      reportType,
      startDate,
      endDate,
      JSON.stringify(vehicleIds),
      format,
      'processing',
      new Date()
    ]);
    client.release();
    const report = reportResult.rows[0];
    const reportError = null;
      
    if (reportError) {
      console.error('Erro ao criar relatório:', reportError);
      return NextResponse.json(
        { error: 'Erro ao criar relatório' },
        { status: 500 }
      );
    }
    
    // Em uma aplicação real, aqui você iniciaria um job em background
    // para gerar o relatório de forma assíncrona
    
    // Simular processamento (em produção, isso seria feito em background)
    setTimeout(async () => {
      // TODO: Implementar query SQL direta
      const updateQuery = `
        UPDATE reports
        SET status = 'completed', file_url = $1
        WHERE id = $2
      `;
      const updateClient = await getConnection();
      await updateClient.query(updateQuery, [
        `/reports/${reportType}_${report.id}.pdf`,
        report.id
      ]);
      updateClient.release();
    }, 2000);
    
    return NextResponse.json({
      message: 'Relatório em processamento',
      reportId: report.id
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
  }
  try {
    // Parâmetros opcionais de paginação
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Buscar relatórios do usuário
    // TODO: Implementar query SQL direta
    const client = await getConnection();
    const reportsQuery = `
      SELECT *
      FROM reports
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const reportsResult = await client.query(reportsQuery, [authResult.user.id, limit, offset]);
    const reports = reportsResult.rows;
    const reportsError = null;
      
    if (reportsError) {
      console.error('Erro ao buscar relatórios:', reportsError);
      return NextResponse.json(
        { error: 'Erro ao buscar relatórios' },
        { status: 500 }
      );
    }
    
    // Contar total para paginação
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reports
      WHERE user_id = $1
    `;
    const countResult = await client.query(countQuery, [authResult.user.id]);
    client.release();
    const count = parseInt(countResult.rows[0]?.total || '0');
    const countError = null;
      
    if (countError) {
      console.error('Erro ao contar relatórios:', countError);
    }
    
    return NextResponse.json({
      reports,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}