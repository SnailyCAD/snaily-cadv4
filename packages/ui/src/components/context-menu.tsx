import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cn } from "mxcn";
import { type ButtonVariantProps, buttonVariants } from "./button/button";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;

export const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      alignOffset={5}
      style={{ scrollbarWidth: "thin" }}
      className={cn(
        "flex flex-col z-50 shadow dark:shadow-primary bg-white dark:bg-primary border dark:border-secondary p-2 rounded-md min-w-[15rem] max-h-[25rem] overflow-auto",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

export const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & ButtonVariantProps
>(({ className, size, variant, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={buttonVariants({
      variant: "transparent",
      className: cn(
        "cursor-pointer my-0.5 rounded-md transition-colors w-full text-left bg-transparent hover:bg-gray-400 focus:bg-gray-400 dark:hover:bg-secondary dark:focus:bg-secondary focus-visible:outline-none",
        className,
        size,
        variant,
      ),
    })}
    {...props}
  />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;
