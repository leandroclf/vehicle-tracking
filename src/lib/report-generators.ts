import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface ReportData {
  reportType: string;
  title?: string;
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
  customFields?: string[];
  customFilters?: {
    field: string;
    operator: string;
    value: string | number;
  }[];
}

// Mapeia tipos de relatório para seus títulos
const reportTypeMap: Record<string, string> = {
  'movement': 'Movimentação de Veículos',
  'stops': 'Paradas',
  'geofence': 'Violações de Geocerca',
  'speed': 'Excesso de Velocidade',
  'mileage': 'Quilometragem',
  'consumption': 'Consumo de Combustível',
  'behavior': 'Comportamento do Motorista',
  'efficiency': 'Eficiência Operacional',
  'custom': 'Relatório Customizado'
};

// Mapeia tipos de relatório para definições de colunas padrão
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
  ],
  'consumption': [
    { header: 'Data', key: 'date' },
    { header: 'Distância (km)', key: 'distance' },
    { header: 'Combustível (L)', key: 'fuel' },
    { header: 'Consumo (km/L)', key: 'consumption' },
    { header: 'Custo (R$)', key: 'cost' }
  ],
  'behavior': [
    { header: 'Data/Hora', key: 'timestamp' },
    { header: 'Evento', key: 'event' },
    { header: 'Severidade', key: 'severity' },
    { header: 'Velocidade', key: 'speed' },
    { header: 'Endereço', key: 'address' }
  ],
  'efficiency': [
    { header: 'Veículo', key: 'vehicle' },
    { header: 'Dist. Total (km)', key: 'totalDistance' },
    { header: 'Tempo de Uso', key: 'usageTime' },
    { header: 'Tempo de Parada', key: 'idleTime' },
    { header: 'Eficiência (%)', key: 'efficiency' }
  ]
};

// Mapeia nomes de campo para cabeçalhos mais amigáveis
const fieldHeaderMap: Record<string, string> = {
  'timestamp': 'Data/Hora',
  'latitude': 'Latitude',
  'longitude': 'Longitude',
  'speed': 'Velocidade',
  'altitude': 'Altitude',
  'direction': 'Direção',
  'odometer': 'Odômetro',
  'fuel_level': 'Nível de Combustível',
  'fuel_consumption': 'Consumo de Combustível',
  'engine_temp': 'Temperatura do Motor',
  'rpm': 'RPM',
  'acceleration': 'Aceleração',
  'braking': 'Frenagem',
  'ignition': 'Ignição',
  'battery': 'Bateria',
  'address': 'Endereço'
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
  
  if (column === 'duration' || column === 'usageTime' || column === 'idleTime') {
    // Assume que duration está em minutos
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${hours}h ${minutes}min`;
  }
  
  if (column === 'fuel') {
    return `${Number(value).toFixed(2)} L`;
  }
  
  if (column === 'consumption') {
    return `${Number(value).toFixed(2)} km/L`;
  }
  
  if (column === 'cost') {
    return `R$ ${Number(value).toFixed(2)}`;
  }
  
  if (column === 'efficiency') {
    return `${Number(value).toFixed(2)}%`;
  }
  
  return String(value);
};

// Função para formatar o cabeçalho do relatório
const formatReportHeader = (reportData: ReportData): string[] => {
  const title = reportData.title || reportTypeMap[reportData.reportType] || reportData.reportType;
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

// Obtém as definições de colunas para o relatório
const getColumnDefinitions = (reportData: ReportData): { header: string; key: string }[] => {
  // Para relatórios customizados, usar os campos personalizados
  if (reportData.reportType === 'custom' && reportData.customFields && reportData.customFields.length > 0) {
    return reportData.customFields.map(field => ({
      header: fieldHeaderMap[field] || field,
      key: field
    }));
  }
  
  // Para tipos padrão, usar as definições pré-configuradas
  return columnDefinitions[reportData.reportType] || [];
};

// Gera relatório em PDF
export const generatePDF = (reportData: ReportData): Blob => {
  const doc = new jsPDF();
  const columns = getColumnDefinitions(reportData);
  
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
  
  // Adicionar informações sobre filtros para relatórios customizados
  if (reportData.reportType === 'custom' && reportData.customFilters && reportData.customFilters.length > 0) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.text('Filtros aplicados:', 14, yPosition);
    doc.setFontSize(10);
    
    reportData.customFilters.forEach((filter, index) => {
      const operatorMap: Record<string, string> = {
        'eq': 'igual a',
        'gt': 'maior que',
        'lt': 'menor que',
        'gte': 'maior ou igual a',
        'lte': 'menor ou igual a',
        'contains': 'contém'
      };
      
      const fieldName = fieldHeaderMap[filter.field] || filter.field;
      const operatorText = operatorMap[filter.operator] || filter.operator;
      const filterText = `${fieldName} ${operatorText} ${filter.value}`;
      
      yPosition += 6;
      doc.text(`- ${filterText}`, 18, yPosition);
    });
    
    yPosition += 8;
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
  const columns = getColumnDefinitions(reportData);
  
  // Criar cabeçalho
  const headerLines = formatReportHeader(reportData);
  
  // Preparar dados para filtros
  let filterLines: string[] = [];
  
  if (reportData.reportType === 'custom' && reportData.customFilters && reportData.customFilters.length > 0) {
    filterLines.push('Filtros aplicados:');
    
    reportData.customFilters.forEach(filter => {
      const operatorMap: Record<string, string> = {
        'eq': 'igual a',
        'gt': 'maior que',
        'lt': 'menor que',
        'gte': 'maior ou igual a',
        'lte': 'menor ou igual a',
        'contains': 'contém'
      };
      
      const fieldName = fieldHeaderMap[filter.field] || filter.field;
      const operatorText = operatorMap[filter.operator] || filter.operator;
      const filterText = `${fieldName} ${operatorText} ${filter.value}`;
      
      filterLines.push(`- ${filterText}`);
    });
  }
  
  // Preparar os dados para a planilha
  const sheetData: any[][] = [
    [headerLines[0]],
    [''],
    ...headerLines.slice(1).map(line => [line]),
    ['']
  ];
  
  // Adicionar filtros se existirem
  if (filterLines.length > 0) {
    filterLines.forEach(line => {
      sheetData.push([line]);
    });
    sheetData.push(['']);
  }
  
  // Adicionar cabeçalhos e dados
  sheetData.push(
    [columns.map(col => col.header)],
    ...reportData.data.map(row => 
      columns.map(col => formatValue(row[col.key], col.key))
    )
  );
  
  // Criar planilha
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Ajustar estilos (não suportado diretamente pelo XLSX, mas podemos ajustar algumas propriedades)
  const headerRowIndex = sheetData.length - reportData.data.length - 1;
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let i = 0; i <= range.e.c; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
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