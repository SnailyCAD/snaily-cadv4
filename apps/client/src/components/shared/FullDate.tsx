import { useMounted } from "@casper124578/useful";
import { useIntl } from "use-intl";
import { HoverCardProps, HoverCard } from "./HoverCard";

interface Props extends Omit<HoverCardProps, "trigger" | "children"> {
  children: Date | string | number;
  onlyDate?: boolean;
  isDateOfBirth?: boolean;
}

export function FullDate({ children, onlyDate, isDateOfBirth, ...rest }: Props) {
  const isMounted = useMounted();
  const { formatDateTime } = useIntl();

  const isCorrectDate = isValidDate(children);
  if (!isCorrectDate) {
    return <span>Invalid Date</span>;
  }

  if (!isMounted) {
    return null;
  }

  let date = new Date(children).getTime();
  if (isDateOfBirth) {
    date = date + 5 * 60 * 60 * 1000;
  }

  return (
    <HoverCard
      openDelay={100}
      trigger={
        <span className="z-30">
          {formatDateTime(date, {
            dateStyle: "medium",
            timeStyle: onlyDate ? undefined : "medium",
          })}
        </span>
      }
      {...rest}
    >
      <span className="font-semibold">
        {formatDateTime(date, { dateStyle: "full", timeStyle: onlyDate ? undefined : "medium" })}
      </span>
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
