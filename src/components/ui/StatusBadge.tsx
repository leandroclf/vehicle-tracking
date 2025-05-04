import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary border-transparent text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary border-transparent text-secondary-foreground hover:bg-secondary/80",
        success:
          "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-400/30",
        warning:
          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-400/30",
        danger:
          "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-400/30",
        info:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-400/30",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, size, icon, pulse = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size }),
          pulse && "animate-pulse",
          className
        )}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </div>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, badgeVariants }; 