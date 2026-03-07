import { type AriaSwitchProps, useSwitch } from "@react-aria/switch";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { useToggleState } from "@react-stately/toggle";
import * as React from "react";
import { cn } from "mxcn";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import { InfoCircle } from "react-bootstrap-icons";

interface SwitchFieldProps extends AriaSwitchProps {
  className?: string;
  description?: string;
}

export function SwitchField(props: SwitchFieldProps) {
  const state = useToggleState(props);
  const ref = React.useRef(null);
  const { inputProps } = useSwitch(props, state, ref);

  return (
    <label
      className={cn(
        "flex items-center mb-3 gap-1.5 font-medium",
        (props.isDisabled || props.isReadOnly) && "opacity-70 cursor-not-allowed",
        props.className,
      )}
    >
      <VisuallyHidden>
        <input {...inputProps} ref={ref} />
      </VisuallyHidden>
      <svg
        className={cn(
          "relative h-6 transition-all rounded-full shadow-sm min-w-[44px] w-11",
          props.isDisabled || props.isReadOnly ? "cursor-default" : "cursor-pointer",
        )}
        width={44}
        height={24}
        aria-hidden="true"
      >
        <rect
          width={44}
          height={24}
          rx={8}
          className={cn(state.isSelected ? "fill-blue-400" : "fill-gray-200 dark:fill-secondary")}
        />
        <circle
          cx={state.isSelected ? 32 : 12}
          cy={12}
          r={8}
          fill="white"
          className={cn(
            "block w-4 h-4 transition-all rounded-full switch-component bg-white dark:bg-gray-200",
          )}
        />
      </svg>
      {props.children}

      {props.description ? (
        <span className="ml-1">
          <HoverCard>
            <HoverCardTrigger asChild>
              <InfoCircle width={14} height={14} />
            </HoverCardTrigger>

            <HoverCardContent pointerEvents>{props.description}</HoverCardContent>
          </HoverCard>
        </span>
      ) : null}
    </label>
  );
}
