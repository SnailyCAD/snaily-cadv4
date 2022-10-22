import * as React from "react";
import { useCalendarState } from "@react-stately/calendar";
import { CalendarProps, useCalendar } from "@react-aria/calendar";
import { createCalendar } from "@internationalized/date";
import { CalendarGrid } from "./calendar-grid";
import { Button } from "../../../button";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { useLocale } from "@react-aria/i18n";

export function Calendar(props: CalendarProps<any>) {
  const { locale } = useLocale();
  const state = useCalendarState({
    ...props,
    locale,
    createCalendar,
  });

  const ref = React.useRef<HTMLDivElement | null>(null);
  const { calendarProps, prevButtonProps, nextButtonProps, title } = useCalendar(props, state);

  return (
    <div {...calendarProps} ref={ref} className="inline-block text-neutral-800 dark:text-white">
      <header className="flex items-center justify-between pb-4">
        <Button className="!px-1.5 mr-1" {...prevButtonProps}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="font-bold text-xl">{title}</h2>

        <Button className="!px-1.5" {...nextButtonProps}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </header>
      <CalendarGrid state={state} />
    </div>
  );
}
