import type * as React from "react";
import * as RHoverCard from "@radix-ui/react-hover-card";
import { classNames } from "lib/classNames";

interface Props extends RHoverCard.HoverCardProps {
  trigger: any;
  children: React.ReactNode;
  /** defaults to `false` */
  pointerEvents?: boolean;
  contentProps?: RHoverCard.HoverCardContentProps;
  showArrow?: boolean;
  disabled?: boolean;
}

export function HoverCard({
  trigger,
  children,
  pointerEvents,
  contentProps,
  disabled,
  ...rest
}: Props) {
  if (disabled) {
    return trigger;
  }

  return (
    <RHoverCard.Root closeDelay={10} openDelay={0} {...rest}>
      <RHoverCard.Trigger asChild>{trigger}</RHoverCard.Trigger>
      <RHoverCard.Content
        sideOffset={5}
        {...contentProps}
        className={classNames(
          pointerEvents ? "pointer-events-auto" : "pointer-events-none",
          "bg-gray-200 dark:bg-dark-bright shadow-lg w-full max-w-2xl p-3 rounded-md dark:text-white hover-card dropdown-fade !z-10",
          contentProps?.className,
        )}
      >
        {children}
        {rest.showArrow ?? true ? (
          <RHoverCard.Arrow className="fill-current text-white dark:text-dark-bright" />
        ) : null}
      </RHoverCard.Content>
    </RHoverCard.Root>
  );
}
