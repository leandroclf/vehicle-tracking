/**
 * Export Dialog - Componente de Diálogo de Exportação
 * @description Modal para configurar e executar exportação de dados
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { DashboardFilters } from '@/types/analytics';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: DashboardFilters;
  onExport: (config: ExportConfig) => Promise<void>;
}

interface ExportConfig {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  type: 'metrics' | 'raw_data' | 'report';
  sections: string[];
  includeCharts: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export function ExportDialog({ open, onOpenChange, filters, onExport }: ExportDialogProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'xlsx',
    type: 'metrics',
    sections: ['fleet', 'usage', 'security'],
    includeCharts: true,
    dateRange: filters.dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);

  const formatOptions = [
    { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { value: 'csv', label: 'CSV (.csv)', icon: FileText },
    { value: 'pdf', label: 'PDF (.pdf)', icon: FileText },
    { value: 'json', label: 'JSON (.json)', icon: FileJson },
  ];

  const typeOptions = [
    { value: 'metrics', label: 'Métricas Consolidadas', description: 'Resumo das principais métricas' },
    { value: 'raw_data', label: 'Dados Brutos', description: 'Dados detalhados para análise' },
    { value: 'report', label: 'Relatório Completo', description: 'Relatório formatado com gráficos' },
  ];

  const sectionOptions = [
    { id: 'fleet', label: 'Métricas da Frota', description: 'Status, performance e consumo' },
    { id: 'usage', label: 'Utilização', description: 'Distâncias, tempo ativo e eficiência' },
    { id: 'security', label: 'Segurança', description: 'Violações, alertas e score de risco' },
    { id: 'financial', label: 'Financeiro', description: 'Custos operacionais e economia' },
    { id: 'maintenance', label: 'Manutenção', description: 'Histórico e programação' },
    { id: 'insights', label: 'Insights', description: 'Análises automáticas e recomendações' },
  ];

  const handleSectionToggle = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(id => id !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('idle');
    setExportError(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onExport(config);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('success');
      
      // Fechar dialog após sucesso
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 2000);
      
    } catch (error) {
      setExportStatus('error');
      setExportError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsExporting(false);
    }
  };

  const resetState = () => {
    setIsExporting(false);
    setExportProgress(0);
    setExportStatus('idle');
    setExportError(null);
  };

  const getFormatIcon = (format: string) => {
    const option = formatOptions.find(opt => opt.value === format);
    return option ? option.icon : FileText;
  };

  const FormatIcon = getFormatIcon(config.format);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Exportar Dados</span>
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para baixar os dados do dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Formato do Arquivo</Label>
            <Select
              value={config.format}
              onValueChange={(value) => setConfig(prev => ({ ...prev, format: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Exportação</Label>
            <Select
              value={config.type}
              onValueChange={(value) => setConfig(prev => ({ ...prev, type: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sections Selection */}
          <div className="space-y-3">
            <Label>Seções a Incluir</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {sectionOptions.map((section) => (
                <div key={section.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={config.sections.includes(section.id)}
                    onCheckedChange={() => handleSectionToggle(section.id)}
                  />
                  <div className="space-y-1">
                    <Label 
                      htmlFor={section.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {section.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Include Charts Option */}
          {(config.format === 'pdf' || config.format === 'xlsx') && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={config.includeCharts}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, includeCharts: !!checked }))
                }
              />
              <Label htmlFor="includeCharts" className="text-sm cursor-pointer">
                Incluir gráficos e visualizações
              </Label>
            </div>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Preparando exportação...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Export Status */}
          {exportStatus === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Arquivo exportado com sucesso! O download iniciará automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {exportStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao exportar arquivo: {exportError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || config.sections.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FormatIcon className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}