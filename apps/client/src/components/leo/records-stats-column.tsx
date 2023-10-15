import type { Record, Violation } from "@snailycad/types";
import { useTranslations } from "use-intl";

interface Props {
  record: Record;
}

function sumOf(violations: Violation[], type: "fine" | "jailTime" | "bail"): number {
  let sum = 0;

  for (const violation of violations) {
    const counts = violation.counts || 1;
    const fine = violation[type];

    if (fine) {
      sum += fine * counts;
    }
  }

  return sum;
}

function formatSum(sum: number) {
  return Intl.NumberFormat().format(sum);
}

export function RecordsStatsColumn(props: Props) {
  const totalBail = formatSum(sumOf(props.record.violations, "bail"));
  const totalJail = formatSum(sumOf(props.record.violations, "jailTime"));
  const totalFines = formatSum(sumOf(props.record.violations, "fine"));
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  return (
    <>
      <b>{t("fines")}:</b> {common("currency")}
      {totalFines}
      <br />
      <b>{t("jail")}:</b> {totalJail}
      <br />
      <b>{t("bail")}:</b> {common("currency")}
      {totalBail}
    </>
  );
}
