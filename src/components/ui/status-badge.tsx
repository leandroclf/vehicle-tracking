import { statusIndicatorVariants, type StatusIndicatorVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
  {
    variants: {
      status: {
        online: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        offline: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        sleep: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        "sem_resposta": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
        "sem_gps": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        "ignicao_ligada": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        "em_movimento": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        bloqueado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        desbloqueado: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
    },
    defaultVariants: {
      status: "offline",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    StatusIndicatorVariants {
  showPulse?: boolean;
  "data-testid"?: string;
}

const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, showPulse = false, "data-testid": testId, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(statusIndicatorVariants({ status }), className)} 
        data-testid={testId}
        role="status"
        aria-label={`Status: ${status}`}
        {...props}
      >
        {showPulse && (
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
          </span>
        )}
        {children}
      </div>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge };