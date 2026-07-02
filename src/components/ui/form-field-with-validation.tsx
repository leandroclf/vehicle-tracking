import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { inputVariants, type InputVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ValidationState = "default" | "success" | "warning" | "error";

const validationConfig = {
  default: {
    icon: null,
    iconColor: "",
    inputVariant: "default" as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    inputVariant: "success" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    inputVariant: "warning" as const,
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-500",
    inputVariant: "error" as const,
  },
};

export interface FormFieldWithValidationProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "textarea";
  validationState?: ValidationState;
  successMessage?: string;
  warningMessage?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  "data-testid"?: string;
}

function FormFieldWithValidation<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  {
    control,
    name,
    label,
    placeholder,
    description,
    type = "text",
    validationState = "default",
    successMessage,
    warningMessage,
    disabled = false,
    required = false,
    className,
    inputClassName,
    "data-testid": testId,
  }: FormFieldWithValidationProps<TFieldValues, TName>
) {
  const config = validationConfig[validationState];
  const Icon = config.icon;
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        // Determinar estado de validação baseado no fieldState
        let currentState = validationState;
        if (fieldState.error) {
          currentState = "error";
        } else if (field.value && !fieldState.error && validationState === "default") {
          currentState = "success";
        }
        
        const currentConfig = validationConfig[currentState];
        const CurrentIcon = currentConfig.icon;
        
        return (
          <FormItem className={cn("space-y-2", className)}>
            <FormLabel 
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                required && "after:content-['*'] after:ml-0.5 after:text-red-500",
                fieldState.error && "text-red-500"
              )}
            >
              {label}
            </FormLabel>
            
            <FormControl>
              <div className="relative">
                {type === "textarea" ? (
                  <Textarea
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                      inputVariants({ variant: currentConfig.inputVariant }),
                      CurrentIcon && "pr-10",
                      inputClassName
                    )}
                    data-testid={testId}
                    aria-invalid={fieldState.error ? "true" : "false"}
                    aria-describedby={`${name}-description ${name}-message`}
                    {...field}
                  />
                ) : (
                  <Input
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                      inputVariants({ variant: currentConfig.inputVariant }),
                      CurrentIcon && "pr-10",
                      inputClassName
                    )}
                    data-testid={testId}
                    aria-invalid={fieldState.error ? "true" : "false"}
                    aria-describedby={`${name}-description ${name}-message`}
                    {...field}
                  />
                )}
                
                {CurrentIcon && (
                  <CurrentIcon 
                    className={cn(
                      "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2",
                      currentConfig.iconColor
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
            </FormControl>
            
            {description && (
              <FormDescription 
                id={`${name}-description`}
                className="text-sm text-muted-foreground"
              >
                {description}
              </FormDescription>
            )}
            
            {/* Mensagens de validação customizadas */}
            {currentState === "success" && successMessage && (
              <p 
                id={`${name}-success`}
                className="text-sm text-green-600 dark:text-green-400"
                role="status"
                aria-live="polite"
              >
                {successMessage}
              </p>
            )}
            
            {currentState === "warning" && warningMessage && (
              <p 
                id={`${name}-warning`}
                className="text-sm text-yellow-600 dark:text-yellow-400"
                role="alert"
                aria-live="assertive"
              >
                {warningMessage}
              </p>
            )}
            
            {/* Mensagem de erro padrão do react-hook-form */}
            <FormMessage 
              id={`${name}-message`}
              role="alert"
              aria-live="assertive"
            />
          </FormItem>
        );
      }}
    />
  );
}

export { FormFieldWithValidation };