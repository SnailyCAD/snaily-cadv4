import * as React from "react";
import { type OverlayTriggerState } from "@react-stately/overlays";
import { DismissButton, Overlay, usePopover, type AriaPopoverProps } from "@react-aria/overlays";
import { mergeProps } from "@react-aria/utils";
import { cn } from "mxcn";

interface Props extends Omit<AriaPopoverProps, "popoverRef"> {
  children: React.ReactNode;
  popoverRef?: React.MutableRefObject<HTMLDivElement | null>;
  className?: string;
  isCalendar?: boolean;

  state: OverlayTriggerState;
}

const MENU_WIDTH = 300;

export function Popover(props: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { popoverRef = ref, triggerRef, children, isCalendar, state, ...otherProps } = props;

  const { popoverProps } = usePopover(
    { popoverRef, triggerRef, placement: "bottom start", ...otherProps },
    state,
  );

  const fieldWidth = triggerRef.current?.clientWidth ?? 0;
  const width = isCalendar ? MENU_WIDTH : fieldWidth;
  const style = { ...popoverProps.style, width };

  return (
    <Overlay>
      <div
        {...mergeProps(popoverProps, otherProps)}
        style={style}
        ref={popoverRef}
        className={cn(
          "absolute bg-gray-200 dark:bg-primary border border-gray-400 dark:border-secondary rounded-md shadow-lg mt-2 p-2 z-10",
          props.className,
        )}
      >
        {children}
        <DismissButton onDismiss={state.close} />
      </div>
    </Overlay>
  );
}
