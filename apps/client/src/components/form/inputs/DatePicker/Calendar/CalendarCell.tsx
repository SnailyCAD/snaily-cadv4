import * as React from "react";
import type { CalendarState } from "@react-stately/calendar";
import { useCalendarCell } from "@react-aria/calendar";
import type { CalendarDate } from "@internationalized/date";
import { useFocusRing } from "@react-aria/focus";
import { mergeProps } from "@react-aria/utils";
import { classNames } from "lib/classNames";

interface Props {
  state: CalendarState;
  date: CalendarDate;
}

export function CalendarCell({ state, date }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    formattedDate,
    isInvalid,
  } = useCalendarCell({ date }, state, ref);

  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    <td {...cellProps} className={`py-0.5 ${isFocusVisible ? "z-10" : "z-0"}`}>
      <div
        {...mergeProps(buttonProps, focusProps)}
        ref={ref}
        hidden={isOutsideVisibleRange}
        className={classNames(
          "w-10 h-10 outline-none group flex items-center justify-center",
          isSelected && (isInvalid ? "bg-red-300" : "bg-blue-600 text-white rounded-md"),
          isDisabled && "opacity-50 cursor-default",
        )}
      >
        <div
          className={classNames(
            "w-full h-full flex items-center justify-center transition-colors",
            isDisabled && !isInvalid && "text-gray-400",
            isFocusVisible && "ring-2 group-focus:z-2 ring-blue-600",
            !isSelected && !isDisabled && "hover:bg-blue-400 hover:text-neutral-800",
            isSelected ? "rounded-md" : "rounded-full",
          )}
        >
          {formattedDate}
        </div>
      </div>
    </td>
  );
}
