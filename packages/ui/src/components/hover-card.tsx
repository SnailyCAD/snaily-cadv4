import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "mxcn";

export const HoverCardTrigger = HoverCardPrimitive.Trigger;

export function HoverCard(props: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root closeDelay={100} openDelay={0} {...props} />;
}

export const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & { pointerEvents?: boolean }
>(({ className, align = "center", sideOffset = 4, pointerEvents = false, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      pointerEvents ? "pointer-events-auto" : "pointer-events-none",
      "bg-gray-200 dark:border dark:border-secondary dark:bg-tertiary shadow-lg w-full max-w-lg p-3 rounded-md dark:text-white hover-card animate-enter z-50",
      className,
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;
