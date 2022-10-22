import { useLocale } from "@react-aria/i18n";
import { useCalendarGrid } from "@react-aria/calendar";
import { getWeeksInMonth } from "@internationalized/date";
import type { CalendarState } from "@react-stately/calendar";
import { CalendarCell } from "./calendar-cell";

export function CalendarGrid({ state, ...rest }: { state: CalendarState }) {
  const { locale } = useLocale();
  const { gridProps, headerProps, weekDays } = useCalendarGrid(rest, state);

  const weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);

  return (
    <table {...gridProps} cellPadding="0" className="flex-1">
      <thead {...headerProps} className="text-neutral-700 dark:text-gray-400">
        <tr>
          {weekDays.map((day, index) => (
            <th className="text-center" key={index}>
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...new Array(weeksInMonth).keys()].map((weekIndex) => (
          <tr key={weekIndex}>
            {state
              .getDatesInWeek(weekIndex)
              .map((date, i) =>
                date ? <CalendarCell key={i} state={state} date={date} /> : <td key={i} />,
              )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
