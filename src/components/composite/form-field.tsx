import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/Label"

interface FormFieldProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  className?: string
  children: React.ReactElement
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, helperText, required, className, children, ...props }, ref) => {
    const id = React.useId()
    const hasError = !!error
    
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <Label htmlFor={id} className={cn(hasError && "text-destructive")}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {React.cloneElement(children, {
          id,
          className: cn(
            children.props.className,
            hasError && "border-destructive focus-visible:ring-destructive"
          ),
          'aria-invalid': hasError,
          'aria-describedby': error ? `${id}-error` : helperText ? `${id}-helper` : undefined,
        })}
        {helperText && !error && (
          <p id={`${id}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"