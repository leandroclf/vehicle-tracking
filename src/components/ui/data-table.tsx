import { forwardRef, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Badge } from '@/components/ui/badge';
import { cardVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal
} from "lucide-react";

export interface DataTableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  "data-testid"?: string;
}

type SortDirection = "asc" | "desc" | null;

const DataTable = forwardRef<HTMLDivElement, DataTableProps<any>>(
  ({
    data,
    columns,
    loading = false,
    searchable = true,
    searchPlaceholder = "Buscar...",
    filterable = true,
    sortable = true,
    pagination = true,
    pageSize = 10,
    emptyMessage = "Nenhum resultado encontrado",
    className,
    onRowClick,
    "data-testid": testId,
  }, ref) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPageSize, setSelectedPageSize] = useState(pageSize);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    
    // Filtrar e ordenar dados
    const processedData = useMemo(() => {
      let filtered = [...data];
      
      // Aplicar busca global
      if (searchTerm) {
        filtered = filtered.filter(row =>
          Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
      
      // Aplicar filtros por coluna
      Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
        if (filterValue) {
          filtered = filtered.filter(row => {
            const cellValue = String(row[columnKey as keyof typeof row] || '');
            return cellValue.toLowerCase().includes(filterValue.toLowerCase());
          });
        }
      });
      
      // Aplicar ordenaÃ§Ã£o
      if (sortColumn && sortDirection) {
        filtered.sort((a, b) => {
          const aValue = a[sortColumn as keyof typeof a];
          const bValue = b[sortColumn as keyof typeof b];
          
          if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
          if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });
      }
      
      return filtered;
    }, [data, searchTerm, sortColumn, sortDirection, columnFilters]);
    
    // PaginaÃ§Ã£o
    const totalPages = Math.ceil(processedData.length / selectedPageSize);
    const startIndex = (currentPage - 1) * selectedPageSize;
    const paginatedData = pagination 
      ? processedData.slice(startIndex, startIndex + selectedPageSize)
      : processedData;
    
    const handleSort = (columnKey: string) => {
      if (!sortable) return;
      
      if (sortColumn === columnKey) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else if (sortDirection === "desc") {
          setSortDirection(null);
          setSortColumn(null);
        } else {
          setSortDirection("asc");
        }
      } else {
        setSortColumn(columnKey);
        setSortDirection("asc");
      }
    };
    
    const handleColumnFilter = (columnKey: string, value: string) => {
      setColumnFilters(prev => ({
        ...prev,
        [columnKey]: value
      }));
      setCurrentPage(1);
    };
    
    const getSortIcon = (columnKey: string) => {
      if (sortColumn !== columnKey) return null;
      return sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
    };
    
    return (
      <div 
        ref={ref}
        className={cn(cardVariants({ padding: "none" }), className)}
        data-testid={testId}
      >
        {/* CabeÃ§alho com busca e filtros */}
        {(searchable || filterable) && (
          <div className="p-4 border-b space-y-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                  data-testid={`${testId}-search`}
                />
              </div>
            )}
            
            {filterable && (
              <div className="flex flex-wrap gap-2">
                {columns
                  .filter(col => col.filterable)
                  .map(column => (
                    <div key={String(column.key)} className="min-w-[150px]">
                      <Input
                        placeholder={`Filtrar ${column.title}`}
                        value={columnFilters[String(column.key)] || ""}
                        onChange={(e) => handleColumnFilter(String(column.key), e.target.value)}
                        className="text-sm"
                        data-testid={`${testId}-filter-${String(column.key)}`}
                      />
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
        
        {/* Tabela */}
        <LoadingOverlay isLoading={loading} variant="skeleton">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead 
                      key={String(column.key)}
                      className={cn(
                        column.className,
                        column.sortable && sortable && "cursor-pointer hover:bg-muted/50 select-none"
                      )}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && sortable && handleSort(String(column.key))}
                    >
                      <div className="flex items-center gap-2">
                        {column.title}
                        {column.sortable && sortable && getSortIcon(String(column.key))}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length} 
                      className="text-center py-8 text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, index) => (
                    <TableRow 
                      key={index}
                      className={cn(
                        onRowClick && "cursor-pointer hover:bg-muted/50"
                      )}
                      onClick={() => onRowClick?.(row, startIndex + index)}
                    >
                      {columns.map((column) => {
                        const value = row[column.key as keyof typeof row];
                        return (
                          <TableCell 
                            key={String(column.key)}
                            className={column.className}
                          >
                            {column.render ? column.render(value, row, startIndex + index) : String(value || '')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </LoadingOverlay>
        
        {/* PaginaÃ§Ã£o */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Mostrando {startIndex + 1} a {Math.min(startIndex + selectedPageSize, processedData.length)} de {processedData.length} resultados
              </span>
              <Select
                value={String(selectedPageSize)}
                onValueChange={(value) => {
                  setSelectedPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map(size => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                data-testid={`${testId}-first-page`}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid={`${testId}-prev-page`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="px-3 py-1 text-sm">
                PÃ¡gina {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                data-testid={`${testId}-next-page`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                data-testid={`${testId}-last-page`}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DataTable.displayName = "DataTable";

export { DataTable };
