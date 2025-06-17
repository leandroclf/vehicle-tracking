import * as React from "react"
import { badgeVariants, type BadgeVariants } from "@/lib/variants"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BadgeVariants {
  "data-testid"?: string;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, "data-testid": testId, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)} 
        data-testid={testId}
        {...props} 
      />
    )
  }
)

Badge.displayName = "Badge"

export { Badge }
export default Badge