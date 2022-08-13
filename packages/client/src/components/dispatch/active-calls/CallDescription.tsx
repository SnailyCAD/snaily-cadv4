import { DEFAULT_EDITOR_DATA, Editor } from "components/modal/DescriptionModal/Editor";
import { HoverCard } from "components/shared/HoverCard";
import { classNames } from "lib/classNames";
import { dataToString } from "lib/editor/dataToString";
import { isArrayEqual } from "lib/editor/isArrayEqual";
import { useTranslations } from "next-intl";
import type { Descendant } from "slate";
import type { Full911Call } from "state/dispatchState";

interface Props {
  call: Full911Call;
}

export function CallDescription({ call }: Props) {
  const common = useTranslations("Common");

  const stringDescription = dataToString(call.descriptionData as Descendant[] | null);
  const isDescriptionLengthy = stringDescription.length >= 1;
  const shouldTruncate = stringDescription.length > 25;
  const hoverCardDisabled =
    !shouldTruncate || isArrayEqual(call.descriptionData as any, DEFAULT_EDITOR_DATA);

  if (!isDescriptionLengthy || !call.description) {
    return <>{common("none")}</>;
  }

  return (
    <HoverCard
      disabled={hoverCardDisabled}
      trigger={
        <div
          className={classNames(
            "w-[300px] truncate overflow-hidden",
            shouldTruncate && "truncate-custom",
          )}
        >
          {call.description || stringDescription}
        </div>
      }
    >
      {call.description ? (
        call.description
      ) : (
        <Editor value={call.descriptionData ?? DEFAULT_EDITOR_DATA} isReadonly />
      )}
    </HoverCard>
  );
}
