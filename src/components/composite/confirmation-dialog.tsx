import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: 'default' | 'destructive' | 'warning' | 'info'
  isLoading?: boolean
  icon?: React.ReactNode
}

const variantIcons = {
  default: CheckCircle,
  destructive: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const variantColors = {
  default: "text-green-600",
  destructive: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default",
  isLoading = false,
  icon,
}: ConfirmationDialogProps) {
  const IconComponent = variantIcons[variant]
  const iconColor = variantColors[variant]

  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {icon || <IconComponent className={`h-6 w-6 ${iconColor}`} />}
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook para facilitar o uso
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Partial<ConfirmationDialogProps>>({})

  const confirm = React.useCallback((options: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...options,
        onConfirm: () => {
          options.onConfirm()
          resolve(true)
          setIsOpen(false)
        },
      })
      setIsOpen(true)
    })
  }, [])

  const dialog = (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          // Se fechou sem confirmar, resolve como false
          // resolve(false)
        }
      }}
      title={config.title || ''}
      description={config.description || ''}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      onConfirm={config.onConfirm || (() => {})}
      variant={config.variant}
      isLoading={config.isLoading}
      icon={config.icon}
    />
  )

  return { confirm, dialog }
}
