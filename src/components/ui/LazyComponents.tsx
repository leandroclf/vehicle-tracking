import { lazy, Suspense, forwardRef } from "react";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { cn } from "@/lib/utils";

// Lazy loading dos componentes pesados
const LazyDialog = lazy(() => import("@/components/ui/Dialog").then(module => ({ default: module.Dialog })));
const LazyDialogContent = lazy(() => import("@/components/ui/Dialog").then(module => ({ default: module.DialogContent })));
const LazySheet = lazy(() => import("@/components/ui/Sheet").then(module => ({ default: module.Sheet })));
const LazySheetContent = lazy(() => import("@/components/ui/Sheet").then(module => ({ default: module.SheetContent })));
const LazyActionMenu = lazy(() => import("@/components/ui/ActionMenu"));
const LazyDataTable = lazy(() => import("@/components/ui/data-table").then(module => ({ default: module.DataTable })));

// Componente de fallback customizável
interface LazyFallbackProps {
  variant?: "spinner" | "skeleton" | "pulse";
  size?: "sm" | "md" | "lg";
  className?: string;
  loadingText?: string;
}

const LazyFallback = ({ 
  variant = "spinner", 
  size = "md", 
  className,
  loadingText = "Carregando componente..."
}: LazyFallbackProps) => (
  <LoadingOverlay
    isLoading={true}
    variant={variant}
    size={size}
    loadingText={loadingText}
    className={cn("min-h-[100px]", className)}
  />
);

// Wrapper para Dialog com lazy loading
export interface LazyDialogWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const LazyDialogWrapper = forwardRef<HTMLDivElement, LazyDialogWrapperProps>(
  ({ children, fallback, className, "data-testid": testId, ...props }, ref) => (
    <Suspense 
      fallback={fallback || <LazyFallback variant="spinner" loadingText="Carregando diálogo..." />}
    >
      <LazyDialog ref={ref} className={className} data-testid={testId} {...props}>
        {children}
      </LazyDialog>
    </Suspense>
  )
);

LazyDialogWrapper.displayName = "LazyDialogWrapper";

// Wrapper para DialogContent com lazy loading
export interface LazyDialogContentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const LazyDialogContentWrapper = forwardRef<HTMLDivElement, LazyDialogContentWrapperProps>(
  ({ children, fallback, className, "data-testid": testId, ...props }, ref) => (
    <Suspense 
      fallback={fallback || <LazyFallback variant="skeleton" loadingText="Carregando conteúdo..." />}
    >
      <LazyDialogContent ref={ref} className={className} data-testid={testId} {...props}>
        {children}
      </LazyDialogContent>
    </Suspense>
  )
);

LazyDialogContentWrapper.displayName = "LazyDialogContentWrapper";

// Wrapper para Sheet com lazy loading
export interface LazySheetWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const LazySheetWrapper = forwardRef<HTMLDivElement, LazySheetWrapperProps>(
  ({ children, fallback, className, "data-testid": testId, ...props }, ref) => (
    <Suspense 
      fallback={fallback || <LazyFallback variant="spinner" loadingText="Carregando painel..." />}
    >
      <LazySheet ref={ref} className={className} data-testid={testId} {...props}>
        {children}
      </LazySheet>
    </Suspense>
  )
);

LazySheetWrapper.displayName = "LazySheetWrapper";

// Wrapper para SheetContent com lazy loading
export interface LazySheetContentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const LazySheetContentWrapper = forwardRef<HTMLDivElement, LazySheetContentWrapperProps>(
  ({ children, fallback, className, "data-testid": testId, ...props }, ref) => (
    <Suspense 
      fallback={fallback || <LazyFallback variant="skeleton" loadingText="Carregando conteúdo do painel..." />}
    >
      <LazySheetContent ref={ref} className={className} data-testid={testId} {...props}>
        {children}
      </LazySheetContent>
    </Suspense>
  )
);

LazySheetContentWrapper.displayName = "LazySheetContentWrapper";

// Wrapper para ActionMenu com lazy loading
export interface LazyActionMenuWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const LazyActionMenuWrapper = forwardRef<HTMLDivElement, LazyActionMenuWrapperProps>(
  ({ children, fallback, className, "data-testid": testId, ...props }, ref) => (
    <Suspense 
      fallback={fallback || <LazyFallback variant="pulse" size="sm" loadingText="Carregando menu..." />}
    >
      <LazyActionMenu ref={ref} className={className} data-testid={testId} {...props}>
        {children}
      </LazyActionMenu>
    </Suspense>
  )
);

LazyActionMenuWrapper.displayName = "LazyActionMenuWrapper";

// Wrapper para DataTable com lazy loading
export interface LazyDataTableWrapperProps {
  data: any[];
  columns: any[];
  fallback?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
  [key: string]: any;
}

const LazyDataTableWrapper = forwardRef<HTMLDivElement, LazyDataTableWrapperProps>(
  ({ data, columns, fallback, className, "data-testid": testId, ...props }, ref) => (
    <Suspense 
      fallback={fallback || <LazyFallback variant="skeleton" loadingText="Carregando tabela..." />}
    >
      <LazyDataTable 
        ref={ref}
        data={data}
        columns={columns}
        className={className}
        data-testid={testId}
        {...props}
      />
    </Suspense>
  )
);

LazyDataTableWrapper.displayName = "LazyDataTableWrapper";

// Hook para preload de componentes
export const usePreloadComponents = () => {
  const preloadDialog = () => {
    import("@/components/ui/Dialog");
  };
  
  const preloadSheet = () => {
    import("@/components/ui/Sheet");
  };
  
  const preloadActionMenu = () => {
    import("@/components/ui/ActionMenu");
  };
  
  const preloadDataTable = () => {
    import("@/components/ui/data-table");
  };
  
  const preloadAll = () => {
    preloadDialog();
    preloadSheet();
    preloadActionMenu();
    preloadDataTable();
  };
  
  return {
    preloadDialog,
    preloadSheet,
    preloadActionMenu,
    preloadDataTable,
    preloadAll,
  };
};

// Componente para preload automático baseado em interação
export interface PreloadTriggerProps {
  children: React.ReactNode;
  components: ('dialog' | 'sheet' | 'actionMenu' | 'dataTable')[];
  trigger?: 'hover' | 'focus' | 'click';
  delay?: number;
}

const PreloadTrigger = ({ 
  children, 
  components, 
  trigger = 'hover', 
  delay = 100 
}: PreloadTriggerProps) => {
  const { preloadDialog, preloadSheet, preloadActionMenu, preloadDataTable } = usePreloadComponents();
  
  const handlePreload = () => {
    setTimeout(() => {
      components.forEach(component => {
        switch (component) {
          case 'dialog':
            preloadDialog();
            break;
          case 'sheet':
            preloadSheet();
            break;
          case 'actionMenu':
            preloadActionMenu();
            break;
          case 'dataTable':
            preloadDataTable();
            break;
        }
      });
    }, delay);
  };
  
  const triggerProps = {
    [trigger === 'hover' ? 'onMouseEnter' : trigger === 'focus' ? 'onFocus' : 'onClick']: handlePreload
  };
  
  return (
    <div {...triggerProps}>
      {children}
    </div>
  );
};

export {
  LazyDialogWrapper,
  LazyDialogContentWrapper,
  LazySheetWrapper,
  LazySheetContentWrapper,
  LazyActionMenuWrapper,
  LazyDataTableWrapper,
  LazyFallback,
  PreloadTrigger,
};