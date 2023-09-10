import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/hover-card";
import { useFormatter, useTimeZone } from "use-intl";

interface FullDateProps {
  children: Date | string | number;
  onlyDate?: boolean;
  isDateOfBirth?: boolean;
  relative?: boolean;
}

export function FullDate({ children, onlyDate, relative, isDateOfBirth }: FullDateProps) {
  const { dateTime, relativeTime } = useFormatter();
  const timezone = useTimeZone();

  const isCorrectDate = isValidDate(children);
  if (!isCorrectDate) {
    return <span>Invalid Date</span>;
  }

  let date = new Date(children).getTime();
  if (isDateOfBirth) {
    date = date + 5 * 60 * 60 * 1000;
  }

  const relativeFormattedTime = relativeTime(date, new Date());
  const formattedTime = dateTime(date, {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: onlyDate ? undefined : "medium",
  });
  const triggerFormattedTime = relative ? relativeFormattedTime : formattedTime;

  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <span suppressHydrationWarning className="z-30">
          {triggerFormattedTime}
        </span>
      </HoverCardTrigger>

      <HoverCardContent pointerEvents>
        <span suppressHydrationWarning className="font-semibold">
          {dateTime(date, { dateStyle: "full", timeStyle: onlyDate ? undefined : "medium" })}{" "}
          {timezone ? `(${timezone})` : ""}
        </span>
      </HoverCardContent>
    </HoverCard>
  );
}

function isValidDate(children: Date | string | number) {
  try {
    return Boolean(new Date(children));
  } catch {
    return false;
  }
}
