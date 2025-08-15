#!/bin/bash

echo "🔧 Corrigindo imports de componentes UI..."

# Lista dos componentes que precisam ser corrigidos (minúscula -> Maiúscula)
components=(
    "alert:Alert"
    "badge:Badge"
    "button:Button"
    "card:Card"
    "checkbox:Checkbox"
    "container:Container"
    "dropdown:Dropdown"
    "input:Input"
    "label:Label"
    "modal:Modal"
    "progress:Progress"
    "select:Select"
    "table:Table"
    "tabs:Tabs"
    "toast:Toast"
    "tooltip:Tooltip"
    "skeleton:Skeleton"
    "separator:Separator"
    "dialog:Dialog"
    "calendar:Calendar"
    "popover:Popover"
    "form:Form"
    "radio-group:RadioGroup"
    "scroll-area:ScrollArea"
    "sheet:Sheet"
    "data-table:DataTable"
    "loading-overlay:LoadingOverlay"
    "status-badge:StatusBadge"
    "confirmation-dialog:ConfirmationDialog"
    "form-field-with-validation:FormFieldWithValidation"
    "dropdown-menu:DropdownMenu"
    "resizable-panels:ResizablePanels"
    "vehicle-status-filters:VehicleStatusFilters"
    "tabs-fixed:TabsFixed"
    "textarea:Textarea"
    "theme-provider:ThemeProvider"
    "svg-icon:SvgIcon"
)

# Corrigir imports absolutos (@/components/ui/)
for component in "${components[@]}"; do
    lowercase=$(echo "$component" | cut -d: -f1)
    uppercase=$(echo "$component" | cut -d: -f2)
    
    echo "  Corrigindo: $lowercase -> $uppercase"
    
    find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|@/components/ui/$lowercase|@/components/ui/$uppercase|g" 2>/dev/null || true
    find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|'@/components/ui/$lowercase'|'@/components/ui/$uppercase'|g" 2>/dev/null || true
    find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|\"@/components/ui/$lowercase\"|\"@/components/ui/$uppercase\"|g" 2>/dev/null || true
done

# Corrigir imports relativos (../ui/, ./ui/)
for component in "${components[@]}"; do
    lowercase=$(echo "$component" | cut -d: -f1)
    uppercase=$(echo "$component" | cut -d: -f2)
    
    find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|../ui/$lowercase|../ui/$uppercase|g" 2>/dev/null || true
    find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|./ui/$lowercase|./ui/$uppercase|g" 2>/dev/null || true
    find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|'../ui/$lowercase'|'../ui/$uppercase'|g" 2>/dev/null || true
    find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|\"../ui/$lowercase\"|\"../ui/$uppercase\"|g" 2>/dev/null || true
done

echo "✅ Imports corrigidos com sucesso!"