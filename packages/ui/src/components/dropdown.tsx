import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "mxcn";
import Link from "next/link";
import { type ButtonVariantProps, buttonVariants } from "./button/button";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 p-2 bg-gray-100 rounded-md shadow-md dark:shadow-primary dropdown-fade w-40 dark:bg-primary border border-secondary",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> &
    ButtonVariantProps & { closeOnClick?: boolean }
>(({ className, size, variant, closeOnClick = true, ...props }, ref) => {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!closeOnClick) {
      e.preventDefault();
      props.onClick?.(e);
    } else {
      props.onClick?.(e);
    }
  }

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      // todo: cn
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
      onClick={handleClick}
    />
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export const DropdownMenuLinkItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { href: string }
>(({ className, href, ...props }, ref) => (
  <DropdownMenuPrimitive.Item ref={ref} {...props} asChild>
    <Link
      href={href}
      // todo: cn
      className={buttonVariants({
        className: cn(
          "outline-none block rounded-md transition-colors w-full text-left bg-transparent dark:hover:bg-secondary hover:bg-gray-400 focus:bg-gray-400 dark:focus:bg-secondary focus-visible:outline-none",
          className,
        ),
        size: "sm",
        variant: "transparent",
      })}
    >
      {props.children}
    </Link>
  </DropdownMenuPrimitive.Item>
));
DropdownMenuLinkItem.displayName = DropdownMenuPrimitive.Item.displayName;
