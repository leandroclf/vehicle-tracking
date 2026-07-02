import { forwardRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { buttonVariants, type ButtonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

type ConfirmationVariant = "destructive" | "warning" | "info" | "success";

const variantConfig = {
  destructive: {
    icon: XCircle,
    iconColor: "text-red-500",
    confirmVariant: "destructive" as const,
    confirmClassName: "",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    confirmVariant: "default" as const,
    confirmClassName: "bg-yellow-500 text-white hover:bg-yellow-600",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    confirmVariant: "default" as const,
    confirmClassName: "bg-blue-600 text-white hover:bg-blue-700",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    confirmVariant: "default" as const,
    confirmClassName: "bg-green-600 text-white hover:bg-green-700",
  },
};

export interface ConfirmationDialogProps {
  /** Elemento que dispara o diálogo (opcional em modo controlado) */
  children?: React.ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Modo controlado: estado de abertura gerenciado externamente */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  "data-testid"?: string;
}

const ConfirmationDialog = forwardRef<HTMLDivElement, ConfirmationDialogProps>(
  ({
    children,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "destructive",
    onConfirm,
    onCancel,
    disabled = false,
    loading = false,
    open: controlledOpen,
    onOpenChange,
    "data-testid": testId,
  }, ref) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = (value: boolean) => {
      if (isControlled) {
        onOpenChange?.(value);
      } else {
        setInternalOpen(value);
      }
    };
    
    const config = variantConfig[variant];
    const Icon = config.icon;
    
    const handleConfirm = async () => {
      try {
        setIsLoading(true);
        await onConfirm();
        setOpen(false);
      } catch (error) {
        console.error("Erro na confirmação:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const handleCancel = () => {
      onCancel?.();
      setOpen(false);
    };
    
    const isButtonDisabled = disabled || loading || isLoading;
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {children && (
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
        )}
        <DialogContent 
          ref={ref}
          className="sm:max-w-[425px]"
          data-testid={testId}
          aria-describedby="confirmation-description"
        >
          <DialogHeader className="flex flex-row items-center gap-3">
            <Icon 
              className={cn("h-6 w-6 flex-shrink-0", config.iconColor)} 
              aria-hidden="true"
            />
            <div className="flex-1">
              <DialogTitle className="text-left">{title}</DialogTitle>
              <DialogDescription 
                id="confirmation-description"
                className="text-left mt-1"
              >
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isButtonDisabled}
              data-testid={`${testId}-cancel`}
            >
              {cancelText}
            </Button>
            <Button
              variant={config.confirmVariant}
              className={config.confirmClassName}
              onClick={handleConfirm}
              disabled={isButtonDisabled}
              data-testid={`${testId}-confirm`}
              aria-describedby="confirmation-description"
            >
              {isLoading ? "Processando..." : confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ConfirmationDialog.displayName = "ConfirmationDialog";

export { ConfirmationDialog };