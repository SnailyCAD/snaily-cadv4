import { HoverCard, HoverCardContent, HoverCardTrigger } from "@snailycad/ui";
import { useFormatter } from "use-intl";

interface Props {
  children: Date | string | number;
  onlyDate?: boolean;
  isDateOfBirth?: boolean;
  relative?: boolean;
}

export function FullDate({ children, onlyDate, relative, isDateOfBirth }: Props) {
  const { dateTime, relativeTime } = useFormatter();

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
          {dateTime(date, { dateStyle: "full", timeStyle: onlyDate ? undefined : "medium" })}
        </span>
      </HoverCardContent>
    </HoverCard>
  );
}

function isValidDate(children: any) {
  try {
    new Date(children);
    return true;
  } catch {
    return false;
  }
}
