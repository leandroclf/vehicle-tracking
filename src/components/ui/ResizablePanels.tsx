"use client";

import * as React from "react";
import { GripVertical, GripHorizontal } from "lucide-react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  ImperativePanelHandle,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface ResizablePanelGroupProps extends React.ComponentProps<typeof PanelGroup> {
  children: React.ReactNode;
  className?: string;
}

const ResizablePanelGroup = React.forwardRef<
  React.ElementRef<typeof PanelGroup>,
  ResizablePanelGroupProps
>(({ className, children, ...props }, ref) => (
  <PanelGroup
    ref={ref}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  >
    {children}
  </PanelGroup>
));
ResizablePanelGroup.displayName = "ResizablePanelGroup";

interface ResizablePanelProps extends React.ComponentProps<typeof Panel> {
  className?: string;
  children: React.ReactNode;
}

const ResizablePanel = React.forwardRef<
  ImperativePanelHandle,
  ResizablePanelProps
>(({ className, children, ...props }, ref) => (
  <Panel
    ref={ref}
    className={cn("relative h-full w-full overflow-auto", className)}
    {...props}
  >
    {children}
  </Panel>
));
ResizablePanel.displayName = "ResizablePanel";

type ResizableHandleProps = {
  withHandle?: boolean;
  className?: string;
  direction?: "horizontal" | "vertical";
} & Omit<React.ComponentProps<typeof PanelResizeHandle>, 'className'>;

const ResizableHandle = ({
  withHandle = false,
  className,
  direction = "horizontal",
  ...props
}: ResizableHandleProps) => (
  <PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-gray-200 dark:bg-gray-700 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      withHandle && "group/handle hover:bg-gray-400 dark:hover:bg-gray-500",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="flex h-6 w-6 items-center justify-center rounded-sm border bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 group-hover/handle:bg-gray-100 dark:group-hover/handle:bg-gray-700">
        {direction === "horizontal" ? (
          <GripVertical className="h-3 w-3" />
        ) : (
          <GripHorizontal className="h-3 w-3" />
        )}
      </div>
    )}
  </PanelResizeHandle>
);
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }; 