import * as React from "react";
import type { CalendarState } from "@react-stately/calendar";
import { useCalendarCell } from "@react-aria/calendar";
import type { CalendarDate } from "@internationalized/date";
import { useFocusRing } from "@react-aria/focus";
import { mergeProps } from "@react-aria/utils";
import { classNames } from "../../../../utils/classNames";
import isToday from "date-fns/isToday";

interface Props {
  state: CalendarState;
  date: CalendarDate;
}

export function CalendarCell(props: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    formattedDate,
    isInvalid,
  } = useCalendarCell({ date: props.date }, props.state, ref);

  const _isToday = isToday(props.date.toDate("UTC"));
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
          title={_isToday ? "Today" : undefined}
          className={classNames(
            "w-full h-full flex items-center justify-center transition-colors",
            _isToday &&
              !isSelected &&
              "bg-blue-400 text-neutral-800 rounded-2xl hover:rounded-md !transition-all",
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
