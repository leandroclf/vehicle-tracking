// Tipos para Sistema de Relatórios Profissionais
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  fields: ReportField[];
  layout: ReportLayout;
  customizable: boolean;
  premium: boolean;
}

export type ReportType = 
  | 'fleet-overview'
  | 'driver-performance' 
  | 'maintenance-schedule'
  | 'fuel-consumption'
  | 'route-analysis'
  | 'compliance-audit'
  | 'financial-summary'
  | 'custom';

export type ReportCategory = 
  | 'operational'
  | 'financial'
  | 'compliance'
  | 'maintenance'
  | 'analytics';

export interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'chart' | 'table' | 'map' | 'image';
  required: boolean;
  configurable: boolean;
  defaultValue?: any;
  options?: ReportFieldOption[];
}

export interface ReportFieldOption {
  label: string;
  value: any;
  description?: string;
}

export interface ReportLayout {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header: ReportSection;
  body: ReportSection[];
  footer: ReportSection;
}

export interface ReportSection {
  id: string;
  type: 'header' | 'content' | 'footer' | 'chart' | 'table' | 'map';
  title?: string;
  content?: string;
  fields: string[];
  style: ReportSectionStyle;
  visible: boolean;
}

export interface ReportSectionStyle {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  margin?: number;
  border?: boolean;
}

export interface ReportConfiguration {
  id: string;
  userId: string;
  templateId: string;
  name: string;
  description?: string;
  filters: ReportFilters;
  customization: ReportCustomization;
  schedule?: ReportSchedule;
  recipients: ReportRecipient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
    preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
  };
  vehicles?: string[];
  drivers?: string[];
  regions?: string[];
  categories?: string[];
  status?: string[];
  customFilters?: Record<string, any>;
}

export interface ReportCustomization {
  companyLogo?: string;
  companyName?: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  showCharts: boolean;
  showMaps: boolean;
  showSummary: boolean;
  includeRawData: boolean;
  customFields: Record<string, any>;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  time: string; // HH:mm format
  timezone: string;
  nextRun?: Date;
  lastRun?: Date;
}

export interface ReportRecipient {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions: ReportPermission[];
}

export type ReportPermission = 
  | 'view'
  | 'download'
  | 'schedule'
  | 'share'
  | 'edit';

export interface ReportGeneration {
  id: string;
  configurationId: string;
  status: ReportGenerationStatus;
  format: ReportFormat;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  metadata: ReportMetadata;
}

export type ReportGenerationStatus = 
  | 'pending'
  | 'processing'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ReportFormat = 
  | 'pdf'
  | 'excel'
  | 'csv'
  | 'json'
  | 'html';

export interface ReportMetadata {
  totalRecords: number;
  dataRange: {
    start: Date;
    end: Date;
  };
  generatedBy: string;
  generatedAt: Date;
  version: string;
  checksum?: string;
}

export interface ReportData {
  summary: ReportSummary;
  details: Record<string, any>[];
  charts: ReportChart[];
  maps: ReportMap[];
  metadata: ReportMetadata;
}

export interface ReportSummary {
  totalVehicles: number;
  activeVehicles: number;
  totalDistance: number;
  totalFuelConsumption: number;
  averageSpeed: number;
  totalAlerts: number;
  complianceScore: number;
  costSummary: {
    fuel: number;
    maintenance: number;
    total: number;
  };
}

export interface ReportChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  data: any[];
  config: {
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
  };
}

export interface ReportMap {
  id: string;
  type: 'route' | 'heatmap' | 'markers' | 'geofences';
  title: string;
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  data: any[];
  style: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
}

export interface ReportExport {
  id: string;
  reportId: string;
  format: ReportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ReportAnalytics {
  reportId: string;
  views: number;
  downloads: number;
  shares: number;
  lastAccessed: Date;
  popularSections: string[];
  averageViewTime: number;
  userFeedback: ReportFeedback[];
}

export interface ReportFeedback {
  userId: string;
  rating: number; // 1-5
  comment?: string;
  helpful: boolean;
  createdAt: Date;
}

// Request/Response types para APIs
export interface CreateReportRequest {
  templateId: string;
  name: string;
  description?: string;
  filters: ReportFilters;
  customization?: Partial<ReportCustomization>;
  schedule?: ReportSchedule;
  recipients?: Omit<ReportRecipient, 'id'>[];
}

export interface GenerateReportRequest {
  configurationId: string;
  format: ReportFormat;
  immediate?: boolean;
}

export interface ReportListResponse {
  reports: ReportConfiguration[];
  total: number;
  page: number;
  limit: number;
}

export interface ReportTemplatesResponse {
  templates: ReportTemplate[];
  categories: ReportCategory[];
}

export interface ReportGenerationResponse {
  generationId: string;
  status: ReportGenerationStatus;
  estimatedTime?: number;
  downloadUrl?: string;
}