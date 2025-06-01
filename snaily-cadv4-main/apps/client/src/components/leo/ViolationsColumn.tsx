import * as React from "react";
import type { Record, Violation } from "@snailycad/types";
import { dataToSlate, Editor } from "components/editor/editor";
import { useValues } from "context/ValuesContext";
import { useTranslations } from "next-intl";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@snailycad/ui";

interface Props {
  violations: (Record["violations"][number] | { penalCodeId: string })[];
}

export function ViolationsColumn({ violations }: Props) {
  const { penalCode } = useValues();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  const getPenalCode = React.useCallback(
    (violation: Violation | { penalCodeId: string | null }) => {
      if (!violation.penalCodeId) {
        return { title: t("deletedPenalCode"), description: common("none") };
      }

      const isViolation = "penalCode" in violation;
      if (isViolation) {
        return violation.penalCode;
      }

      const isString = "penalCodeId" in violation;
      if (isString) {
        return penalCode.values.find((p) => p.id === violation.penalCodeId) ?? null;
      }

      return null;
    },
    [penalCode.values, common, t],
  );

  if (violations.length <= 0) {
    return <>{common("none")}</>;
  }

  return (
    <>
      {violations.map((violation, idx) => {
        const comma = idx !== violations.length - 1 ? ", " : "";
        const key = "id" in violation ? violation.id : idx;
        const penalCode = getPenalCode(violation);

        if (!penalCode) return null;

        return (
          <HoverCard key={key} openDelay={350}>
            <HoverCardTrigger asChild>
              <span className="dark:hover:bg-tertiary px-1 py-0.5 cursor-help rounded-sm">
                {penalCode.title} {comma}
              </span>
            </HoverCardTrigger>

            <HoverCardContent pointerEvents>
              <h3 className="text-lg font-semibold px-2">{penalCode.title}</h3>

              <div className="dark:text-gray-200 mt-2 text-base">
                <Editor isReadonly value={dataToSlate(penalCode)} />
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </>
  );
}
