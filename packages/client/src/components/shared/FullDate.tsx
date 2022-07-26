import type { HoverCardProps } from "@radix-ui/react-hover-card";
import format from "date-fns/format";
import { formatDate } from "lib/utils";
import { HoverCard } from "./HoverCard";

interface Props extends Omit<HoverCardProps, "children"> {
  children: Date | string | number;
  onlyDate?: boolean;
  isDateOfBirth?: boolean;
}

export function FullDate({ children, onlyDate, isDateOfBirth }: Props) {
  const hmsString = onlyDate ? "" : "HH:mm:ss";
  let date = new Date(children).getTime();

  if (isDateOfBirth) {
    date = date + 5 * 60 * 60 * 1000;
  }
  const formatted = format(new Date(date), `EEEE, MMMM dd, yyyy ${hmsString}`);

  return (
    <HoverCard
      openDelay={100}
      trigger={<span>{formatDate(children, { onlyDate: onlyDate ?? false })}</span>}
    >
      <span className="font-semibold">{formatted}</span>
    </HoverCard>
  );
}
