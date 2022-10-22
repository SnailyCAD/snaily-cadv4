import { useMounted } from "@casper124578/useful";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { formatDate } from "lib/utils";
import { HoverCardProps, HoverCard } from "./HoverCard";

interface Props extends Omit<HoverCardProps, "trigger" | "children"> {
  children: Date | string | number;
  onlyDate?: boolean;
  formatRelative?: boolean;
  isDateOfBirth?: boolean;
}

export function FullDate({ children, onlyDate, isDateOfBirth, formatRelative, ...rest }: Props) {
  const isMounted = useMounted();
  const hmsString = onlyDate ? "" : "HH:mm:ss";

  const isCorrectDate = isValidDate(children);
  if (!isCorrectDate) {
    return <span>Invalid Date</span>;
  }

  let date = parseISO(children.toString()).getTime();
  if (isDateOfBirth) {
    date = date + 5 * 60 * 60 * 1000;
  }

  const formatted = format(
    new Date(new Date(date).toUTCString()),
    `EEEE, MMMM dd, yyyy ${hmsString}`,
  );
  const trigger = formatDate(children, {
    onlyDate: onlyDate ?? false,
    formatRelative: formatRelative ?? true,
  });

  return (
    <HoverCard
      openDelay={100}
      trigger={<span className="z-30">{isMounted ? trigger : null}</span>}
      {...rest}
    >
      <span className="font-semibold">{formatted}</span>
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
