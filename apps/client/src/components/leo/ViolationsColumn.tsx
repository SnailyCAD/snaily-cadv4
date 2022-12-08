import * as React from "react";
import type { Record } from "@snailycad/types";
import { dataToSlate, Editor } from "components/editor/editor";
import { HoverCard } from "components/shared/HoverCard";
import { useValues } from "context/ValuesContext";
import { useTranslations } from "next-intl";

interface Props {
  violations: (Record["violations"][number] | { penalCodeId: string })[];
}

export function ViolationsColumn({ violations }: Props) {
  const { penalCode } = useValues();
  const common = useTranslations("Common");

  const getPenalCode = React.useCallback(
    (penalCodeId: string) => {
      return penalCode.values.find((p) => p.id === penalCodeId) ?? null;
    },
    [penalCode.values],
  );

  if (violations.length <= 0) {
    return <>{common("none")}</>;
  }

  return (
    <>
      {violations.map((violation, idx) => {
        const comma = idx !== violations.length - 1 ? ", " : "";
        const key = "id" in violation ? violation.id : idx;

        const penalCode =
          "penalCode" in violation ? violation.penalCode : getPenalCode(violation.penalCodeId);
        if (!penalCode) return null;

        return (
          <HoverCard
            openDelay={350}
            key={key}
            trigger={
              <span className="dark:hover:bg-tertiary px-1 py-0.5 cursor-help rounded-sm">
                {penalCode.title} {comma}
              </span>
            }
          >
            <h3 className="text-lg font-semibold px-2">{penalCode.title}</h3>

            <div className="dark:text-gray-200 mt-2 text-base">
              <Editor isReadonly value={dataToSlate(penalCode)} />
            </div>
          </HoverCard>
        );
      })}
    </>
  );
}
