import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface ReportData {
  reportType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  data: Record<string, any>[];
  vehicleInfo?: {
    id: string;
    plate?: string;
    model?: string;
    name?: string;
  }[];
}

// Mapeia tipos de relatório para seus títulos
const reportTypeMap: Record<string, string> = {
  'movement': 'Movimentação de Veículos',
  'stops': 'Paradas',
  'geofence': 'Violações de Geocerca',
  'speed': 'Excesso de Velocidade',
  'mileage': 'Quilometragem'
};

// Mapeia tipos de relatório para definições de colunas
const columnDefinitions: Record<string, { header: string; key: string }[]> = {
  'movement': [
    { header: 'Data/Hora', key: 'timestamp' },
    { header: 'Latitude', key: 'lat' },
    { header: 'Longitude', key: 'lng' },
    { header: 'Velocidade', key: 'speed' },
    { header: 'Direção', key: 'direction' },
    { header: 'Endereço', key: 'address' }
  ],
  'stops': [
    { header: 'Início', key: 'startTime' },
    { header: 'Fim', key: 'endTime' },
    { header: 'Duração', key: 'duration' },
    { header: 'Endereço', key: 'address' }
  ],
  'geofence': [
    { header: 'Data/Hora', key: 'timestamp' },
    { header: 'Tipo', key: 'eventType' },
    { header: 'Nome da Geocerca', key: 'geofenceName' },
    { header: 'Endereço', key: 'address' }
  ],
  'speed': [
    { header: 'Data/Hora', key: 'timestamp' },
    { header: 'Velocidade', key: 'speed' },
    { header: 'Limite', key: 'speedLimit' },
    { header: 'Excesso', key: 'overSpeed' },
    { header: 'Endereço', key: 'address' }
  ],
  'mileage': [
    { header: 'Data', key: 'date' },
    { header: 'Distância (km)', key: 'distance' },
    { header: 'Início', key: 'startAddress' },
    { header: 'Fim', key: 'endAddress' }
  ]
};

// Formata valores para exibição em relatórios
const formatValue = (value: any, column: string): string => {
  if (value === null || value === undefined) return '-';
  
  if (typeof value === 'string' && (column.includes('Time') || column === 'timestamp' || column === 'date')) {
    try {
      return format(new Date(value), 'dd/MM/yyyy HH:mm:ss');
    } catch (e) {
      return value;
    }
  }
  
  if (column === 'speed' || column === 'overSpeed' || column === 'speedLimit') {
    return `${value} km/h`;
  }
  
  if (column === 'distance') {
    return `${Number(value).toFixed(2)} km`;
  }
  
  if (column === 'duration') {
    // Assume que duration está em minutos
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${hours}h ${minutes}min`;
  }
  
  return String(value);
};

// Função para formatar o cabeçalho do relatório
const formatReportHeader = (reportData: ReportData): string[] => {
  const title = reportTypeMap[reportData.reportType] || reportData.reportType;
  const vehicles = reportData.vehicleInfo ? 
    reportData.vehicleInfo.map(v => v.plate ? `${v.model || ''} (${v.plate})` : v.name || v.id).join(', ') :
    'Todos os veículos';
  
  const startDate = format(new Date(reportData.startDate), 'dd/MM/yyyy');
  const endDate = format(new Date(reportData.endDate), 'dd/MM/yyyy');
  
  return [
    `Relatório de ${title}`,
    `Período: ${startDate} a ${endDate}`,
    `Veículos: ${vehicles}`,
    `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`
  ];
};

// Gera relatório em PDF
export const generatePDF = (reportData: ReportData): Blob => {
  const doc = new jsPDF();
  const columns = columnDefinitions[reportData.reportType] || [];
  
  // Adicionar cabeçalho
  const headerLines = formatReportHeader(reportData);
  let yPosition = 20;
  
  doc.setFontSize(16);
  doc.text(headerLines[0], 14, yPosition);
  
  doc.setFontSize(10);
  for (let i = 1; i < headerLines.length; i++) {
    yPosition += 7;
    doc.text(headerLines[i], 14, yPosition);
  }
  
  // Adicionar tabela de dados
  const tableHeaders = columns.map(col => col.header);
  const tableData = reportData.data.map(row => 
    columns.map(col => formatValue(row[col.key], col.key))
  );
  
  (doc as any).autoTable({
    startY: yPosition + 10,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 122, 183],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'auto',
      fontSize: 9
    }
  });
  
  return doc.output('blob');
};

// Gera relatório em Excel
export const generateExcel = (reportData: ReportData): Blob => {
  const workbook = XLSX.utils.book_new();
  const columns = columnDefinitions[reportData.reportType] || [];
  
  // Criar cabeçalho
  const headerLines = formatReportHeader(reportData);
  
  // Preparar os dados para a planilha
  const sheetData = [
    [headerLines[0]],
    [''],
    ...headerLines.slice(1).map(line => [line]),
    [''],
    [columns.map(col => col.header)],
    ...reportData.data.map(row => 
      columns.map(col => formatValue(row[col.key], col.key))
    )
  ];
  
  // Criar planilha
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Ajustar estilos (não suportado diretamente pelo XLSX, mas podemos ajustar algumas propriedades)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let i = 0; i <= range.e.c; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 4, c: i });
    worksheet[cellRef] = {
      ...worksheet[cellRef],
      s: { font: { bold: true } }
    };
  }
  
  // Adicionar planilha ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
  
  // Converter para blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Função para escolher o gerador apropriado com base no formato solicitado
export const generateReport = (reportData: ReportData, format: 'PDF' | 'Excel'): Blob => {
  return format === 'PDF' ? generatePDF(reportData) : generateExcel(reportData);
}; 