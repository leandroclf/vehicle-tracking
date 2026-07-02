import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Ícone exibido à esquerda dentro do campo */
  leftIcon?: React.ReactNode;
  /** Mensagem de erro exibida abaixo do campo */
  error?: string;
  /** Texto auxiliar exibido abaixo do campo (quando não há erro) */
  helperText?: string;
}

const baseClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, error, helperText, ...props }, ref) => {
    const input = (
      <input
        type={type}
        className={cn(
          baseClassName,
          leftIcon && "pl-10",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        aria-invalid={error ? true : undefined}
        ref={ref}
        {...props}
      />
    );

    if (!leftIcon && !error && !helperText) {
      return input;
    }

    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:h-5 [&>svg]:w-5">
              {leftIcon}
            </span>
          )}
          {input}
        </div>
        {error ? (
          <p className="mt-1 text-sm text-red-500" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
export default Input;
