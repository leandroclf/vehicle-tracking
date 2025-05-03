import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { generateReport, ReportData } from '@/lib/report-generators';

// Definir interface para os diferentes tipos de dados de relatório
interface MovementDataItem {
  timestamp: string;
  lat: string;
  lng: string;
  speed: number;
  direction: number;
  address: string;
}

interface StopDataItem {
  startTime: string;
  endTime: string;
  duration: number;
  address: string;
}

interface GeofenceDataItem {
  timestamp: string;
  eventType: string;
  geofenceName: string;
  address: string;
}

interface SpeedDataItem {
  timestamp: string;
  speed: number;
  speedLimit: number;
  isViolation: boolean;
  location: string;
}

interface MileageDataItem {
  date: string;
  distance: number;
  startLocation: string;
  endLocation: string;
}

type ReportDataItem = MovementDataItem | StopDataItem | GeofenceDataItem | SpeedDataItem | MileageDataItem;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const reportId = params.id;
    
    // Buscar relatório pelo ID
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();
      
    if (reportError || !report) {
      console.error('Erro ao buscar relatório:', reportError);
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o relatório está pronto
    if (report.status !== 'completed') {
      return NextResponse.json(
        { error: 'Relatório ainda não está pronto para download' },
        { status: 400 }
      );
    }
    
    // Buscar dados de veículos para incluir no relatório
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, plate, model')
      .in('id', report.vehicle_ids);
    
    // Buscar dados do relatório
    // Neste caso, vamos simular os dados com base no tipo de relatório
    // Em um sistema real, estes dados viriam de uma consulta ao banco
    let reportData: ReportDataItem[] = [];
    
    switch (report.report_type) {
      case 'movement':
        reportData = generateMovementData(report.start_date, report.end_date);
        break;
      case 'stops':
        reportData = generateStopsData(report.start_date, report.end_date);
        break;
      case 'geofence':
        reportData = generateGeofenceData(report.start_date, report.end_date);
        break;
      case 'speed':
        reportData = generateSpeedData(report.start_date, report.end_date);
        break;
      case 'mileage':
        reportData = generateMileageData(report.start_date, report.end_date);
        break;
      default:
        reportData = [];
    }
    
    // Preparar dados para geração do relatório
    const reportDataObj: ReportData = {
      reportType: report.report_type,
      startDate: report.start_date,
      endDate: report.end_date,
      createdAt: report.created_at,
      data: reportData,
      vehicleInfo: vehicles || []
    };
    
    // Gerar relatório no formato desejado (padrão: PDF)
    const format = request.nextUrl.searchParams.get('format')?.toUpperCase() === 'EXCEL' 
      ? 'Excel' 
      : 'PDF';
    
    const reportBlob = generateReport(reportDataObj, format);
    
    // Configurar cabeçalhos para download
    const headers = new Headers();
    if (format === 'PDF') {
      headers.append('Content-Type', 'application/pdf');
      headers.append('Content-Disposition', `attachment; filename="relatorio-${reportId}.pdf"`);
    } else {
      headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      headers.append('Content-Disposition', `attachment; filename="relatorio-${reportId}.xlsx"`);
    }
    
    // Converter Blob para ArrayBuffer para resposta
    const arrayBuffer = await reportBlob.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Erro ao processar download:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Funções auxiliares para gerar dados simulados para cada tipo de relatório
// Em um sistema real, estes dados viriam do banco de dados

function generateMovementData(startDate: string, endDate: string): MovementDataItem[] {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let date = new Date(start); date <= end; date = new Date(date.getTime() + dayMs)) {
    // Gerar alguns pontos para cada dia
    for (let i = 0; i < 10; i++) {
      data.push({
        timestamp: new Date(date.getTime() + i * 3600000).toISOString(),
        lat: (-23.55 + (Math.random() * 0.1)).toFixed(6),
        lng: (-46.63 + (Math.random() * 0.1)).toFixed(6),
        speed: Math.floor(Math.random() * 100),
        direction: Math.floor(Math.random() * 360),
        address: `Av. Paulista, ${1000 + Math.floor(Math.random() * 1000)}, São Paulo - SP`
      });
    }
  }
  
  return data;
}

function generateStopsData(startDate: string, endDate: string): StopDataItem[] {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let date = new Date(start); date <= end; date = new Date(date.getTime() + dayMs)) {
    // Gerar algumas paradas para cada dia
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(date.getTime() + i * 6 * 3600000);
      const endTime = new Date(startTime.getTime() + Math.random() * 3600000);
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
      
      data.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: durationMinutes,
        address: `R. Augusta, ${500 + Math.floor(Math.random() * 500)}, São Paulo - SP`
      });
    }
  }
  
  return data;
}

function generateGeofenceData(startDate: string, endDate: string): GeofenceDataItem[] {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayMs = 24 * 60 * 60 * 1000;
  const eventTypes = ['entrada', 'saída'];
  const geofenceNames = ['Escritório Central', 'Depósito', 'Filial Norte', 'Cliente ABC'];
  
  for (let date = new Date(start); date <= end; date = new Date(date.getTime() + dayMs)) {
    // Gerar alguns eventos para cada dia
    for (let i = 0; i < 4; i++) {
      data.push({
        timestamp: new Date(date.getTime() + i * 6 * 3600000).toISOString(),
        eventType: eventTypes[i % 2],
        geofenceName: geofenceNames[i % geofenceNames.length],
        address: `Alameda Santos, ${1000 + Math.floor(Math.random() * 1000)}, São Paulo - SP`
      });
    }
  }
  
  return data;
}

function generateSpeedData(startDate: string, endDate: string): SpeedDataItem[] {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let date = new Date(start); date <= end; date = new Date(date.getTime() + dayMs)) {
    // Gerar alguns eventos de excesso de velocidade para cada dia
    for (let i = 0; i < 3; i++) {
      const speed = 80 + Math.floor(Math.random() * 40);
      const speedLimit = 80;
      
      data.push({
        timestamp: new Date(date.getTime() + i * 8 * 3600000).toISOString(),
        speed: speed,
        speedLimit: speedLimit,
        isViolation: speed > speedLimit,
        location: `Marginal Pinheiros, km ${Math.floor(Math.random() * 20)}, São Paulo - SP`
      });
    }
  }
  
  return data;
}

function generateMileageData(startDate: string, endDate: string): MileageDataItem[] {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let date = new Date(start); date <= end; date = new Date(date.getTime() + dayMs)) {
    data.push({
      date: date.toISOString().split('T')[0],
      distance: Math.random() * 100 + 50,
      startLocation: 'Av. Brigadeiro Faria Lima, 3900, São Paulo - SP',
      endLocation: 'R. Oscar Freire, 2500, São Paulo - SP'
    });
  }
  
  return data;
} 