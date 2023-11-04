import { components, type MultiValueGenericProps } from "react-select";
import type { PenalCode } from "@snailycad/types";
import { dataToSlate, Editor } from "components/editor/editor";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@snailycad/ui";
import { useTranslations } from "use-intl";

export function MultiValueContainerPenalCode(props: MultiValueGenericProps<any>) {
  const penalCode = props.data.value as PenalCode;
  const t = useTranslations("Leo");

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div>
          <components.MultiValueContainer {...props} />
        </div>
      </HoverCardTrigger>

      <HoverCardContent pointerEvents>
        <h3 className="text-lg font-semibold px-2">{penalCode.title || t("deletedPenalCode")}</h3>

        <div className="dark:text-gray-200 mt-2 text-base">
          <Editor isReadonly value={dataToSlate(penalCode)} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
