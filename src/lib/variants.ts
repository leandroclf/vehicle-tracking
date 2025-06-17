import { cva, type VariantProps } from "class-variance-authority";

// Variantes base para badges e indicadores de status
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
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

// Variantes para botões com estados específicos do domínio
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700",
        info: "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Variantes para indicadores de status de veículos
export const statusIndicatorVariants = cva(
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

// Variantes para cards com diferentes propósitos
export const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "border-border shadow-md",
        outlined: "border-2 border-border",
        ghost: "border-transparent shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

// Variantes para inputs com estados de validação
export const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
        warning: "border-yellow-500 focus-visible:ring-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type StatusIndicatorVariants = VariantProps<typeof statusIndicatorVariants>;
export type CardVariants = VariantProps<typeof cardVariants>;
export type InputVariants = VariantProps<typeof inputVariants>;