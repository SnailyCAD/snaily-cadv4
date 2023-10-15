import { components, type MultiValueGenericProps } from "react-select";
import type { PenalCode } from "@snailycad/types";
import { dataToSlate, Editor } from "components/editor/editor";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@snailycad/ui";

export function MultiValueContainerPenalCode(props: MultiValueGenericProps<any>) {
  const penalCode = props.data.value as PenalCode;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div>
          <components.MultiValueContainer {...props} />
        </div>
      </HoverCardTrigger>

      <HoverCardContent pointerEvents>
        <h3 className="text-lg font-semibold px-2">{penalCode.title}</h3>

        <div className="dark:text-gray-200 mt-2 text-base">
          <Editor isReadonly value={dataToSlate(penalCode)} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
