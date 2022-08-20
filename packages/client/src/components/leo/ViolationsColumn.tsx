import type { Record } from "@snailycad/types";
import { dataToSlate, Editor } from "components/editor/Editor";
import { HoverCard } from "components/shared/HoverCard";
import { useTranslations } from "next-intl";

interface Props {
  violations: Record["violations"];
}

export function ViolationsColumn({ violations }: Props) {
  const common = useTranslations("Common");

  if (violations.length <= 0) {
    return <>{common("none")}</>;
  }

  return (
    <>
      {violations.map((violation, idx) => {
        const comma = idx !== violations.length - 1 ? ", " : "";

        return (
          <HoverCard
            openDelay={350}
            key={violation.id}
            trigger={
              <span className="dark:hover:bg-dark-bright px-1 py-0.5 cursor-help rounded-sm">
                {violation.penalCode.title} {comma}
              </span>
            }
          >
            <h3 className="text-lg font-semibold px-2">{violation.penalCode.title}</h3>

            <div className="dark:text-gray-200 mt-2 text-base">
              <Editor isReadonly value={dataToSlate(violation.penalCode)} />
            </div>
          </HoverCard>
        );
      })}
    </>
  );
}
