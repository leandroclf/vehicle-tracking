import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: "none" | "sm" | "md" | "lg" | "xl"
  responsive?: boolean
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = "md", responsive = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          {
            "grid-cols-1": cols === 1,
            "grid-cols-2": cols === 2,
            "grid-cols-3": cols === 3,
            "grid-cols-4": cols === 4,
            "grid-cols-5": cols === 5,
            "grid-cols-6": cols === 6,
            "grid-cols-12": cols === 12,
            "gap-0": gap === "none",
            "gap-2": gap === "sm",
            "gap-4": gap === "md",
            "gap-6": gap === "lg",
            "gap-8": gap === "xl",
            "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4": responsive && cols >= 4,
            "sm:grid-cols-2 md:grid-cols-3": responsive && cols === 3,
            "sm:grid-cols-2": responsive && cols === 2,
          },
          className
        )}
        {...props}
      />
    )
  }
)
Grid.displayName = "Grid"

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 12
}

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span = 1, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          {
            "col-span-1": span === 1,
            "col-span-2": span === 2,
            "col-span-3": span === 3,
            "col-span-4": span === 4,
            "col-span-5": span === 5,
            "col-span-6": span === 6,
            "col-span-12": span === 12,
          },
          className
        )}
        {...props}
      />
    )
  }
)
GridItem.displayName = "GridItem"

export { Grid, GridItem }
export default Grid