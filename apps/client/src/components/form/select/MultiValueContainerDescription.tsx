import { components, MultiValueGenericProps } from "react-select";
import type { DriversLicenseCategoryValue } from "@snailycad/types";
import { dataToSlate, Editor } from "components/editor/editor";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@snailycad/ui";

export function MultiValueContainerDescription(props: MultiValueGenericProps<any>) {
  const value = props.data as Pick<DriversLicenseCategoryValue, "description">;

  const trigger = (
    <div className="cursor-help">
      <components.MultiValueContainer {...props} />
    </div>
  );

  if (!value.description) {
    return trigger;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>

      <HoverCardContent pointerEvents>
        <div className="dark:text-gray-200 mt-2 text-base min-w-[300px]">
          <Editor isReadonly value={dataToSlate(value)} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
