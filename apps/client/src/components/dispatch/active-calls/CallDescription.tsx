import { DEFAULT_EDITOR_DATA } from "components/editor/editor";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import type { Descendant } from "slate";
import dynamic from "next/dynamic";
import { slateDataToString } from "@snailycad/utils/editor";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@snailycad/ui";

const Editor = dynamic(async () => (await import("components/editor/editor")).Editor, {
  ssr: false,
});

interface Props {
  data: { descriptionData?: any; description?: string | null };
  nonCard?: boolean;
}

export function CallDescription({ data, nonCard }: Props) {
  const common = useTranslations("Common");

  const stringDescription =
    slateDataToString(data.descriptionData as Descendant[] | null) || data.description;

  if (!stringDescription) {
    return <>{common("none")}</>;
  }

  const isDescriptionLengthy = stringDescription.length >= 1;
  const shouldTruncate = stringDescription.length > 45;
  const hoverCardDisabled = !shouldTruncate;

  const hasDescription = isDescriptionLengthy || !data.description;
  if (!hasDescription) {
    return <>{common("none")}</>;
  }

  return (
    <HoverCard open={hoverCardDisabled ? false : undefined}>
      <HoverCardTrigger asChild>
        <div
          className={classNames(
            "w-[300px] truncate overflow-hidden",
            shouldTruncate && (nonCard ? "truncate-custom-non-card" : "truncate-custom"),
            shouldTruncate && "cursor-help",
          )}
        >
          {data.description || stringDescription}
        </div>
      </HoverCardTrigger>

      <HoverCardContent className="z-[999]" pointerEvents>
        {data.description ? (
          <p className="w-full whitespace-pre-wrap">{data.description}</p>
        ) : (
          <Editor hideBorder value={data.descriptionData ?? DEFAULT_EDITOR_DATA} isReadonly />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
