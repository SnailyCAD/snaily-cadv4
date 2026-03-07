import * as React from "react";
import { useLocale } from "@react-aria/i18n";
import {
  useDateFieldState,
  type DateSegment,
  type DateFieldState,
} from "@react-stately/datepicker";
import { type AriaDatePickerProps, useDateField, useDateSegment } from "@react-aria/datepicker";
import { type DateValue, createCalendar } from "@internationalized/date";
import { cn } from "mxcn";

export function DateField(props: AriaDatePickerProps<DateValue>) {
  const { locale } = useLocale();
  const state = useDateFieldState({
    ...props,
    locale,
    createCalendar,
  });

  const ref = React.useRef<HTMLDivElement | null>(null);
  const { fieldProps } = useDateField(props, state, ref);

  return (
    <div {...fieldProps} ref={ref} className="flex">
      {state.segments.map((segment, i) => (
        <DateSegment key={i} segment={segment} state={state} />
      ))}
    </div>
  );
}

function DateSegment(props: { segment: DateSegment; state: DateFieldState }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const { segmentProps } = useDateSegment(props.segment, props.state, ref);

  return (
    <div
      {...segmentProps}
      autoCapitalize="off"
      ref={ref}
      style={{
        ...segmentProps.style,
        minWidth:
          typeof props.segment.maxValue === "number"
            ? `${String(props.segment.maxValue).length}ch`
            : undefined,
      }}
      className={cn(
        "px-0.5 tabular-nums text-right outline-none rounded-sm focus:bg-blue-600 focus:text-white group",
        !props.segment.isEditable ? "text-gray-500" : "text-neutral-800 dark:text-white",
        props.segment.type === "literal" && "mx-1",
      )}
    >
      <span
        aria-hidden="true"
        className="block w-full text-center italic text-gray-500 group-focus:text-white"
        style={{
          visibility: props.segment.isPlaceholder ? "visible" : "hidden",
          height: props.segment.isPlaceholder ? "" : 0,
          pointerEvents: "none",
        }}
      >
        {props.segment.placeholder}
      </span>
      {props.segment.isPlaceholder ? "" : props.segment.text}
    </div>
  );
}
