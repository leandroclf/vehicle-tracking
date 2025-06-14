# Guia de Uso dos Componentes shadcn/ui

## 🎯 Visão Geral

Este guia fornece exemplos práticos de como usar os componentes shadcn/ui migrados no projeto de rastreamento de veículos.

## 📋 Componentes Base

### Button

```tsx
import { Button } from "@/components/ui/button"
import { Plus, Download, Trash2 } from "lucide-react"

// Variantes disponíveis
<Button variant="default">Salvar</Button>
<Button variant="destructive">Excluir</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Plus className="h-4 w-4" /></Button>

// Com ícones
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Adicionar Veículo
</Button>

// Estados
<Button disabled>Carregando...</Button>
<Button loading>Salvando...</Button>
```

### Input

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Input básico
<div className="space-y-2">
  <Label htmlFor="plate">Placa do Veículo</Label>
  <Input 
    id="plate" 
    placeholder="ABC-1234" 
    maxLength={8}
  />
</div>

// Input com erro
<Input 
  placeholder="Email" 
  error="Email é obrigatório"
  className="border-destructive"
/>

// Input de busca
<Input 
  type="search" 
  placeholder="Buscar veículos..."
  className="max-w-sm"
/>
```

### Card

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Estatísticas de Frota</CardTitle>
    <CardDescription>
      Resumo dos veículos ativos na sua frota
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">24</div>
        <div className="text-sm text-muted-foreground">Veículos Online</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">3</div>
        <div className="text-sm text-muted-foreground">Em Manutenção</div>
      </div>
    </div>
  </CardContent>
</Card>
```

## 🎛️ Componentes Interativos

### Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button>Adicionar Veículo</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Novo Veículo</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Formulário aqui */}
    </div>
  </DialogContent>
</Dialog>
```

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Tipo de veículo" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="car">Carro</SelectItem>
    <SelectItem value="truck">Caminhão</SelectItem>
    <SelectItem value="motorcycle">Motocicleta</SelectItem>
    <SelectItem value="van">Van</SelectItem>
  </SelectContent>
</Select>
```

### Dropdown Menu

```tsx
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Eye, Edit, Trash } from "lucide-react"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <Eye className="mr-2 h-4 w-4" />
      Ver detalhes
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Edit className="mr-2 h-4 w-4" />
      Editar
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      <Trash className="mr-2 h-4 w-4" />
      Excluir
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 📊 Componentes de Dados

### Table

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Veículo</TableHead>
      <TableHead>Placa</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Localização</TableHead>
      <TableHead className="text-right">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {vehicles.map((vehicle) => (
      <TableRow key={vehicle.id}>
        <TableCell className="font-medium">{vehicle.name}</TableCell>
        <TableCell>{vehicle.plate}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(vehicle.status)}>
            {vehicle.status}
          </Badge>
        </TableCell>
        <TableCell>{vehicle.location}</TableCell>
        <TableCell className="text-right">
          {/* Ações aqui */}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## 📝 Componentes de Formulário

### Form com React Hook Form

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const vehicleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  plate: z.string().min(7, "Placa deve ter pelo menos 7 caracteres"),
  type: z.enum(["car", "truck", "motorcycle", "van"])
})

function VehicleForm() {
  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      plate: "",
      type: "car"
    }
  })

  function onSubmit(values: z.infer<typeof vehicleSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Veículo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Caminhão 01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa</FormLabel>
              <FormControl>
                <Input placeholder="ABC-1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Salvar Veículo</Button>
      </form>
    </Form>
  )
}
```

## 🎨 Componentes Compostos

### FormField (Customizado)

```tsx
import { FormField } from "@/components/composite/form-field"

<FormField
  label="Email"
  required
  helperText="Será usado para notificações"
  error={errors.email?.message}
>
  <Input 
    type="email" 
    placeholder="seu@email.com"
    {...register("email")}
  />
</FormField>
```

### ConfirmationDialog

```tsx
import { ConfirmationDialog, useConfirmationDialog } from "@/components/composite/confirmation-dialog"

function VehicleActions() {
  const confirmDialog = useConfirmationDialog()

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Excluir Veículo",
      description: "Esta ação não pode ser desfeita. O veículo será removido permanentemente.",
      variant: "destructive",
      confirmText: "Excluir",
      cancelText: "Cancelar"
    })

    if (confirmed) {
      // Executar exclusão
    }
  }

  return (
    <>
      <Button onClick={handleDelete} variant="destructive">
        Excluir Veículo
      </Button>
      <ConfirmationDialog />
    </>
  )
}
```

### VehicleCard

```tsx
import { VehicleCard, VehicleList } from "@/components/composite/vehicle-card"

// Card individual
<VehicleCard
  vehicle={{
    id: "1",
    name: "Caminhão 01",
    plate: "ABC-1234",
    status: "online",
    lastUpdate: new Date(),
    location: "São Paulo, SP",
    speed: 60,
    fuel: 75,
    battery: 90,
    type: "truck"
  }}
  onSelect={(vehicle) => console.log('Selecionado:', vehicle)}
  onEdit={(vehicle) => console.log('Editar:', vehicle)}
  onTrack={(vehicle) => console.log('Rastrear:', vehicle)}
/>

// Lista de veículos
<VehicleList
  vehicles={vehicles}
  onSelectVehicle={handleSelectVehicle}
  onEditVehicle={handleEditVehicle}
  onTrackVehicle={handleTrackVehicle}
  compact={false}
/>
```

## 🎭 Estados e Feedback

### Loading States

```tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

// Skeleton para carregamento
<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[150px]" />
</div>

// Progress bar
<Progress value={progress} className="w-full" />
```

### Alert Messages

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

// Sucesso
<Alert>
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Sucesso!</AlertTitle>
  <AlertDescription>
    Veículo adicionado com sucesso.
  </AlertDescription>
</Alert>

// Erro
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erro</AlertTitle>
  <AlertDescription>
    Não foi possível conectar com o servidor.
  </AlertDescription>
</Alert>
```

## 🎨 Temas e Customização

### CSS Variables Disponíveis

```css
/* Em globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

### Customização de Componentes

```tsx
// Usando className para customizar
<Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
  Botão Customizado
</Button>

// Usando CSS variables
<Card style={{ '--card-background': 'hsl(210 40% 98%)' }}>
  Card com fundo customizado
</Card>
```

## 📱 Responsividade

### Breakpoints Recomendados

```tsx
// Mobile First
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Conteúdo */}
</div>

// Sheet para mobile, Dialog para desktop
<div className="md:hidden">
  <Sheet>
    {/* Conteúdo mobile */}
  </Sheet>
</div>
<div className="hidden md:block">
  <Dialog>
    {/* Conteúdo desktop */}
  </Dialog>
</div>
```

## ♿ Acessibilidade

### Boas Práticas

```tsx
// Sempre usar labels
<Label htmlFor="vehicle-name">Nome do Veículo</Label>
<Input id="vehicle-name" />

// ARIA attributes
<Button aria-label="Fechar modal" size="icon">
  <X className="h-4 w-4" />
</Button>

// Focus management
<Dialog>
  <DialogContent>
    <DialogTitle>Título acessível</DialogTitle>
    {/* Conteúdo */}
  </DialogContent>
</Dialog>

// Keyboard navigation
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={() => action1()}>
      Ação 1
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 🔗 Links Úteis

- [Documentação shadcn/ui](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Class Variance Authority](https://cva.style)

---

**Dica**: Use o comando `npx shadcn add [component]` para adicionar novos componentes conforme necessário.