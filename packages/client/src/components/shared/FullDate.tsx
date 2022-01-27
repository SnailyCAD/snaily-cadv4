import type { HoverCardProps } from "@radix-ui/react-hover-card";
import format from "date-fns/format";
import { formatDate } from "lib/utils";
import { HoverCard } from "./HoverCard";

interface Props extends HoverCardProps {
  children: Date | string | number;
  onlyDate?: boolean;
}

export function FullDate({ children, onlyDate }: Props) {
  const hmsString = onlyDate ? "" : "HH:mm:ss";
  const formatted = format(new Date(children), `EEEE, MMMM dd, yyyy ${hmsString}`);

  return (
    <HoverCard
      openDelay={100}
      trigger={<span>{formatDate(children, { onlyDate: onlyDate ?? false })}</span>}
    >
      <span className="font-semibold">{formatted}</span>
    </HoverCard>
  );
}
