import type * as React from "react";
import * as RHoverCard from "@radix-ui/react-hover-card";

interface Props extends RHoverCard.HoverCardProps {
  trigger: any;
  children: React.ReactNode;
}

export function HoverCard({ trigger, children, ...rest }: Props) {
  return (
    <RHoverCard.Root closeDelay={10} openDelay={0} {...rest}>
      <RHoverCard.Trigger asChild>{trigger}</RHoverCard.Trigger>
      <RHoverCard.Content
        className="bg-gray-200 dark:bg-dark-bright shadow-lg w-full max-w-2xl p-3 rounded-md dark:text-white pointer-events-none"
        sideOffset={7}
      >
        {children}
        <RHoverCard.Arrow className="fill-current text-white dark:text-dark-bright" />
      </RHoverCard.Content>
    </RHoverCard.Root>
  );
}
