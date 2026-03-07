import { type AriaCheckboxProps, useCheckbox } from "@react-aria/checkbox";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { useToggleState } from "@react-stately/toggle";
import * as React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import { InfoCircle } from "react-bootstrap-icons";
import { cn } from "mxcn";
import { useFocusRing } from "@react-aria/focus";

interface CheckboxFieldProps extends AriaCheckboxProps {
  className?: string;
  description?: string;
}

export function CheckboxField(props: CheckboxFieldProps) {
  const state = useToggleState(props);
  const ref = React.useRef(null);
  const { inputProps } = useCheckbox(props, state, ref);
  const { isFocusVisible, focusProps } = useFocusRing();

  const isSelected = state.isSelected && !props.isIndeterminate;

  return (
    <label
      className={cn(
        "flex items-center mb-3 gap-1.5 font-medium dark:text-white",
        props.isDisabled || (props.isReadOnly && "opacity-50 cursor-not-allowed"),
        props.className,
      )}
    >
      <VisuallyHidden>
        <input {...inputProps} {...focusProps} ref={ref} />
      </VisuallyHidden>
      <svg width={24} height={24} aria-hidden="true">
        <rect
          className={cn(
            "transition-all stroke-2 rounded-md stroke-",
            isSelected
              ? "fill-blue-400 stroke-none w-4 h-4"
              : "fill-white dark:fill-gray-200 stroke-secondary w-3.5 h-3.5",
          )}
          x={isSelected ? 4 : 5}
          y={isSelected ? 4 : 5}
          rx={2}
        />
        {isSelected && (
          <path
            transform="translate(7 7)"
            d={`M3.788 9A.999.999 0 0 1 3 8.615l-2.288-3a1 1 0 1 1
            1.576-1.23l1.5 1.991 3.924-4.991a1 1 0 1 1 1.576 1.23l-4.712
            6A.999.999 0 0 1 3.788 9z`}
          />
        )}
        {props.isIndeterminate && (
          <rect x={7} y={11} width={10} height={2} className="fill-secondary" />
        )}
        {isFocusVisible && (
          <rect
            x={1}
            y={1}
            width={22}
            height={22}
            fill="none"
            stroke="orange"
            strokeWidth={2}
            rx={2}
          />
        )}
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
