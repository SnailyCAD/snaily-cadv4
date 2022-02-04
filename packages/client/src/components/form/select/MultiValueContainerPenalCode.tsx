import { components, MultiValueGenericProps } from "react-select";
import { HoverCard } from "components/shared/HoverCard";
import type { PenalCode } from "@snailycad/types";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";

export function MultiValueContainerPenalCode(props: MultiValueGenericProps<any>) {
  const penalCode = props.data.value as PenalCode;

  return (
    <HoverCard
      trigger={
        <div>
          <components.MultiValueContainer {...props} />
        </div>
      }
    >
      <h3 className="text-lg font-semibold px-2">{penalCode.title}</h3>

      <div className="dark:text-gray-200 mt-2 text-base">
        <Editor isReadonly value={dataToSlate(penalCode)} />
      </div>
    </HoverCard>
  );
}
