import { DEFAULT_EDITOR_DATA, Editor } from "components/editor/Editor";
import { HoverCard } from "components/shared/HoverCard";
import { classNames } from "lib/classNames";
import { dataToString } from "lib/editor/dataToString";
import { isArrayEqual } from "lib/editor/isArrayEqual";
import { useTranslations } from "next-intl";
import type { Descendant } from "slate";

interface Props {
  data: { descriptionData?: any; description?: string | null };
  nonCard?: boolean;
}

export function CallDescription({ data, nonCard }: Props) {
  const common = useTranslations("Common");

  const stringDescription =
    dataToString(data.descriptionData as Descendant[] | null) ?? data.description;

  if (!stringDescription) {
    return <>{common("none")}</>;
  }

  const isDescriptionLengthy = stringDescription.length >= 1;
  const shouldTruncate = stringDescription.length > 25;
  const hoverCardDisabled =
    !shouldTruncate || isArrayEqual(data.descriptionData as any, DEFAULT_EDITOR_DATA);

  const hasDescription = isDescriptionLengthy || !data.description;
  if (!hasDescription) {
    return <>{common("none")}</>;
  }

  return (
    <HoverCard
      pointerEvents
      disabled={hoverCardDisabled}
      trigger={
        <div
          className={classNames(
            "w-[300px] truncate overflow-hidden cursor-help",
            shouldTruncate && nonCard ? "truncate-custom-non-card" : "truncate-custom",
          )}
        >
          {data.description || stringDescription}
        </div>
      }
    >
      {data.description ? (
        <p className="w-full whitespace-pre-wrap">{data.description}</p>
      ) : (
        <Editor value={data.descriptionData ?? DEFAULT_EDITOR_DATA} isReadonly />
      )}
    </HoverCard>
  );
}
