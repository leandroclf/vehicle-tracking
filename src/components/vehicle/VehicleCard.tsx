import * as React from "react"
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Car,
  MapPin,
  Clock,
  MoreVertical,
  Eye,
  Settings,
  AlertTriangle,
  Wifi,
  WifiOff,
  Battery,
  Fuel
} from "lucide-react"
import { cn } from "@/lib/utils"

// Tipos para o veículo
interface Vehicle {
  id: string
  name: string
  plate: string
  status: 'online' | 'offline' | 'moving' | 'parked' | 'maintenance'
  lastUpdate: string | Date
  location?: string
  speed?: number
  fuel?: number
  battery?: number
  imageUrl?: string
  type: 'car' | 'truck' | 'motorcycle' | 'van' | 'boat'
}

interface VehicleCardProps {
  vehicle: Vehicle
  onSelect?: (vehicle: Vehicle) => void
  onEdit?: (vehicle: Vehicle) => void
  onTrack?: (vehicle: Vehicle) => void
  showActions?: boolean
  compact?: boolean
  className?: string
}

// Configurações de status
const statusConfig = {
  online: {
    label: 'Online',
    variant: 'default' as const,
    color: 'bg-green-500',
    icon: Wifi
  },
  offline: {
    label: 'Offline',
    variant: 'secondary' as const,
    color: 'bg-gray-500',
    icon: WifiOff
  },
  moving: {
    label: 'Em movimento',
    variant: 'default' as const,
    color: 'bg-blue-500',
    icon: Car
  },
  parked: {
    label: 'Estacionado',
    variant: 'outline' as const,
    color: 'bg-yellow-500',
    icon: MapPin
  },
  maintenance: {
    label: 'Manutenção',
    variant: 'destructive' as const,
    color: 'bg-red-500',
    icon: AlertTriangle
  }
}

// Ícones por tipo de veículo
const vehicleTypeIcons = {
  car: Car,
  truck: Car, // Pode ser substituído por ícone específico
  motorcycle: Car, // Pode ser substituído por ícone específico
  van: Car, // Pode ser substituído por ícone específico
  boat: Car, // Pode ser substituído por ícone específico
}

function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getTimeAgo(date: string | Date): string {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}min atrás`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h atrás`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d atrás`
}

export function VehicleCard({
  vehicle,
  onSelect,
  onEdit,
  onTrack,
  showActions = true,
  compact = false,
  className,
}: VehicleCardProps) {
  const statusInfo = statusConfig[vehicle.status]
  const StatusIcon = statusInfo.icon
  const VehicleIcon = vehicleTypeIcons[vehicle.type]

  return (
    <TooltipProvider>
      <Card className={cn(
        "hover:shadow-md transition-all duration-200 cursor-pointer group",
        "hover:border-primary/50",
        compact ? "p-3" : "",
        className
      )}>
        <CardHeader className={cn(
          "flex flex-row items-center space-y-0",
          compact ? "pb-2 px-0" : "pb-3"
        )}>
          {/* Avatar e informações básicas */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative">
              <div className={cn(
                "relative overflow-hidden rounded-full bg-primary/10 flex items-center justify-center",
                compact ? "h-8 w-8" : "h-12 w-12"
              )}>
                {vehicle.imageUrl ? (
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <VehicleIcon className={cn(compact ? "h-4 w-4" : "h-6 w-6", "text-primary")} />
                )}
              </div>
              {/* Indicador de status */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                statusInfo.color
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-semibold truncate",
                  compact ? "text-sm" : "text-base"
                )}>
                  {vehicle.name}
                </h3>
                <Badge variant={statusInfo.variant} className={cn(
                  "flex items-center gap-1",
                  compact ? "text-xs px-1.5 py-0.5" : ""
                )}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </div>
              <p className={cn(
                "text-muted-foreground font-mono",
                compact ? "text-xs" : "text-sm"
              )}>
                {vehicle.plate}
              </p>
              {vehicle.location && !compact && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {vehicle.location}
                </p>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    compact ? "h-6 w-6" : "h-8 w-8"
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onSelect && (
                  <DropdownMenuItem onClick={() => onSelect(vehicle)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                )}
                {onTrack && (
                  <DropdownMenuItem onClick={() => onTrack(vehicle)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Rastrear
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        {!compact && (
          <CardContent className="pt-0">
            {/* Métricas do veículo */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-4 text-sm">
                {vehicle.speed !== undefined && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Car className="h-3 w-3" />
                        <span>{vehicle.speed} km/h</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Velocidade atual</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {vehicle.fuel !== undefined && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Fuel className="h-3 w-3" />
                        <span>{vehicle.fuel}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nível de combustível</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {vehicle.battery !== undefined && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Battery className="h-3 w-3" />
                        <span>{vehicle.battery}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nível da bateria</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Última atualização */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(vehicle.lastUpdate)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatDateTime(vehicle.lastUpdate)}</p>
                </TooltipContent>
              </Tooltip>

              {onSelect && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelect(vehicle)}
                  className="h-7 text-xs"
                >
                  Ver detalhes
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  )
}

// Componente para lista de veículos
interface VehicleListProps {
  vehicles: Vehicle[]
  onSelectVehicle?: (vehicle: Vehicle) => void
  onEditVehicle?: (vehicle: Vehicle) => void
  onTrackVehicle?: (vehicle: Vehicle) => void
  compact?: boolean
  className?: string
}

export function VehicleList({
  vehicles,
  onSelectVehicle,
  onEditVehicle,
  onTrackVehicle,
  compact = false,
  className
}: VehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum veículo encontrado</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "grid gap-4",
      compact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2",
      className
    )}>
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onSelect={onSelectVehicle}
          onEdit={onEditVehicle}
          onTrack={onTrackVehicle}
          compact={compact}
        />
      ))}
    </div>
  )
}
