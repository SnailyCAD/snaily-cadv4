import { components, MultiValueGenericProps } from "react-select";
import { HoverCard } from "components/shared/HoverCard";
import type { DriversLicenseCategoryValue } from "@snailycad/types";
import { dataToSlate, Editor } from "components/editor/editor";

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
    <HoverCard portal={false} pointerEvents trigger={trigger}>
      <div className="dark:text-gray-200 mt-2 text-base min-w-[300px]">
        <Editor isReadonly value={dataToSlate(value)} />
      </div>
    </HoverCard>
  );
}
