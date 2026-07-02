import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { cardVariants, type CardVariants } from "@/lib/variants";

type LoadingVariant = "spinner" | "pulse" | "skeleton";
type LoadingSize = "sm" | "md" | "lg";

const sizeConfig = {
  sm: {
    icon: "h-4 w-4",
    text: "text-sm",
    spacing: "gap-2",
  },
  md: {
    icon: "h-6 w-6",
    text: "text-base",
    spacing: "gap-3",
  },
  lg: {
    icon: "h-8 w-8",
    text: "text-lg",
    spacing: "gap-4",
  },
};

export interface LoadingOverlayProps extends Omit<CardVariants, "variant"> {
  isLoading: boolean;
  children?: React.ReactNode;
  loadingText?: string;
  variant?: LoadingVariant;
  size?: LoadingSize;
  overlay?: boolean;
  className?: string;
  "data-testid"?: string;
}

const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({
    isLoading,
    children,
    loadingText = "Carregando...",
    variant = "spinner",
    size = "md",
    overlay = true,
    className,
    padding,
    "data-testid": testId,
    ...cardProps
  }, ref) => {
    const config = sizeConfig[size];
    
    if (!isLoading && children) {
      return <>{children}</>;
    }
    
    const LoadingContent = () => {
      switch (variant) {
        case "pulse":
          return (
            <div 
              className={cn(
                "flex flex-col items-center justify-center",
                config.spacing
              )}
              role="status"
              aria-label={loadingText}
            >
              <div className={cn(
                "rounded-full bg-primary animate-pulse-slow",
                config.icon
              )} />
              {loadingText && (
                <span className={cn(
                  "text-muted-foreground animate-pulse",
                  config.text
                )}>
                  {loadingText}
                </span>
              )}
            </div>
          );
          
        case "skeleton":
          return (
            <div className="space-y-3" role="status" aria-label={loadingText}>
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              {loadingText && (
                <span className="sr-only">{loadingText}</span>
              )}
            </div>
          );
          
        default: // spinner
          return (
            <div 
              className={cn(
                "flex flex-col items-center justify-center",
                config.spacing
              )}
              role="status"
              aria-label={loadingText}
            >
              <Loader2 
                className={cn(
                  "animate-spin text-primary",
                  config.icon
                )} 
                aria-hidden="true"
              />
              {loadingText && (
                <span className={cn(
                  "text-muted-foreground",
                  config.text
                )}>
                  {loadingText}
                </span>
              )}
            </div>
          );
      }
    };
    
    if (overlay && children) {
      return (
        <div 
          ref={ref}
          className={cn("relative", className)}
          data-testid={testId}
        >
          {children}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className={cn(
                cardVariants({ padding }),
                "bg-card border shadow-lg"
              )}>
                <LoadingContent />
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div 
        ref={ref}
        className={cn(
          cardVariants({ padding, ...cardProps }),
          "flex items-center justify-center min-h-[200px]",
          className
        )}
        data-testid={testId}
      >
        <LoadingContent />
      </div>
    );
  }
);

LoadingOverlay.displayName = "LoadingOverlay";

// Componente auxiliar para refresh manual
export interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  isLoading?: boolean;
  size?: LoadingSize;
  className?: string;
  "data-testid"?: string;
}

const RefreshButton = forwardRef<HTMLButtonElement, RefreshButtonProps>(
  ({ onRefresh, isLoading = false, size = "md", className, "data-testid": testId }, ref) => {
    const config = sizeConfig[size];
    
    return (
      <button
        ref={ref}
        onClick={onRefresh}
        disabled={isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          size === "sm" && "h-8 w-8",
          size === "md" && "h-10 w-10",
          size === "lg" && "h-12 w-12",
          className
        )}
        data-testid={testId}
        aria-label="Atualizar"
      >
        <RefreshCw 
          className={cn(
            config.icon,
            isLoading && "animate-spin"
          )} 
        />
      </button>
    );
  }
);

RefreshButton.displayName = "RefreshButton";

export { LoadingOverlay, RefreshButton };