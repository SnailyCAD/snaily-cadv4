import type { DepartmentValue, DivisionValue } from "@snailycad/types";
import { useFormikContext } from "formik";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useTranslations } from "next-intl";

interface Props {
  department: DepartmentValue | null;
  divisions: DivisionValue[];
}

export function CallSignPreview({ divisions, department }: Props) {
  const { generateCallsign } = useGenerateCallsign();
  const t = useTranslations("Leo");
  const { values } = useFormikContext<{ citizenId: string; callsign: string; callsign2: string }>();

  if (!department || !values.callsign || !values.callsign2 || !values.citizenId) {
    return null;
  }

  const unit = {
    department,
    citizenId: values.citizenId,
    callsign: values.callsign,
    callsign2: values.callsign2,
    divisions,
    incremental: null,
    activeDivisionCallsign: null,
  };

  return (
    <span className="inline-block mb-2 mt-2 text-[1.1rem]">
      <span className="font-semibold">{t("callsignPreview")}:</span> {generateCallsign(unit)}
    </span>
  );
}
