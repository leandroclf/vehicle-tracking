import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn, composeRefs } from "@/lib/utils";

const ActionMenu = DropdownMenuPrimitive.Root;

const ActionMenuTrigger = DropdownMenuPrimitive.Trigger;

const ActionMenuGroup = DropdownMenuPrimitive.Group;

const ActionMenuPortal = DropdownMenuPrimitive.Portal;

const ActionMenuSub = DropdownMenuPrimitive.Sub;

const ActionMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const ActionMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>>(null);
  
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={composeRefs(internalRef, ref)}
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-gray-100 data-[state=open]:bg-gray-100 dark:focus:bg-gray-800 dark:data-[state=open]:bg-gray-800",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
ActionMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const ActionMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>>(null);
  
  return (
    <DropdownMenuPrimitive.SubContent
      ref={composeRefs(internalRef, ref)}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md animate-in data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        className
      )}
      {...props}
    />
  );
});
ActionMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const ActionMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.Content>>(null);
  
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={composeRefs(internalRef, ref)}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
ActionMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const ActionMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    destructive?: boolean;
  }
>(({ className, inset, destructive, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.Item>>(null);
  
  return (
    <DropdownMenuPrimitive.Item
      ref={composeRefs(internalRef, ref)}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
        inset && "pl-8",
        destructive && "text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-900/30",
        "focus:bg-gray-100 dark:focus:bg-gray-700",
        className
      )}
      {...props}
    />
  );
});
ActionMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const ActionMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>>(null);
  
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={composeRefs(internalRef, ref)}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
ActionMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const ActionMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>>(null);
  
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={composeRefs(internalRef, ref)}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="h-2 w-2 rounded-full bg-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});
ActionMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const ActionMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.Label>>(null);
  
  return (
    <DropdownMenuPrimitive.Label
      ref={composeRefs(internalRef, ref)}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
});
ActionMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const ActionMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.Separator>>(null);
  
  return (
    <DropdownMenuPrimitive.Separator
      ref={composeRefs(internalRef, ref)}
      className={cn("-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800", className)}
      {...props}
    />
  );
});
ActionMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const ActionMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
ActionMenuShortcut.displayName = "ActionMenuShortcut";

// Componente de alto nível para facilitar o uso comum
const ActionMenuButton = ({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ActionMenu> & {
  className?: string;
  children: React.ReactNode;
}) => (
  <ActionMenu {...props}>
    <ActionMenuTrigger asChild>
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md p-1 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
          className
        )}
        aria-label="Ações"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </ActionMenuTrigger>
    {children}
  </ActionMenu>
);

export {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuCheckboxItem,
  ActionMenuRadioItem,
  ActionMenuLabel,
  ActionMenuSeparator,
  ActionMenuShortcut,
  ActionMenuGroup,
  ActionMenuPortal,
  ActionMenuSub,
  ActionMenuSubContent,
  ActionMenuSubTrigger,
  ActionMenuRadioGroup,
  ActionMenuButton,
}; 