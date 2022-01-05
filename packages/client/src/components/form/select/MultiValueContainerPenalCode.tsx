import { components, MultiValueGenericProps } from "react-select";
import * as HoverCard from "@radix-ui/react-hover-card";
import { PenalCode } from "types/prisma";

export function MultiValueContainerPenalCode(props: MultiValueGenericProps<PenalCode>) {
  const value = props.data.value as PenalCode;

  return (
    <HoverCardDemo penalCode={value}>
      <div>
        <components.MultiValueContainer {...props} />
      </div>
    </HoverCardDemo>
  );
}

interface HoverCardProps {
  children: React.ReactNode;
  penalCode: PenalCode;
}

const HoverCardDemo = ({ children, penalCode }: HoverCardProps) => (
  <HoverCard.Root closeDelay={10} openDelay={0}>
    <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
    <HoverCard.Content
      className="bg-gray-200 dark:bg-dark-bright shadow-lg w-full max-w-2xl p-3 rounded-md dark:text-white pointer-events-none"
      sideOffset={7}
    >
      <h3 className="text-lg font-semibold">{penalCode.title}</h3>

      <p className="dark:text-gray-200 mt-2 text-base">{penalCode.description}</p>
      <HoverCard.Arrow className="fill-current text-white dark:text-dark-bright" />
    </HoverCard.Content>
  </HoverCard.Root>
);
