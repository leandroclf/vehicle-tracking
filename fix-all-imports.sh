#!/bin/bash

echo "🔧 Correção abrangente de todos os imports problemáticos..."

# Buscar todos os arquivos com imports problemáticos
echo "📋 Identificando arquivos com problemas..."

# Corrigir problemas específicos encontrados nos logs
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "StatusBadge" | while read file; do
    echo "  Corrigindo StatusBadge em: $file"
    sed -i 's|../ui/StatusBadge|../ui/status-badge|g' "$file"
    sed -i 's|@/components/ui/StatusBadge|@/components/ui/status-badge|g' "$file"
done

find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "DataTable" | while read file; do
    echo "  Corrigindo DataTable em: $file"
    sed -i 's|@/components/ui/DataTable|@/components/ui/data-table|g' "$file"
done

find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "ResizablePanels" | while read file; do
    echo "  Corrigindo ResizablePanels em: $file"
    sed -i 's|@/components/ui/ResizablePanels|@/components/ui/resizable-panels|g' "$file"
    sed -i 's|../ui/ResizablePanels|../ui/resizable-panels|g' "$file"
done

find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "ThemeProvider" | while read file; do
    echo "  Corrigindo ThemeProvider em: $file"
    sed -i 's|@/components/ui/ThemeProvider|@/components/ui/theme-provider|g' "$file"
    sed -i 's|../ui/ThemeProvider|../ui/theme-provider|g' "$file"
done

find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "Skeleton" | while read file; do
    echo "  Corrigindo Skeleton em: $file"
    sed -i 's|../ui/Skeleton|../ui/skeleton|g' "$file"
    sed -i 's|@/components/ui/Skeleton|@/components/ui/skeleton|g' "$file"
done

echo "✅ Correção abrangente concluída!"