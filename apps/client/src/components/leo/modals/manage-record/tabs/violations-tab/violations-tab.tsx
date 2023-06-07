import type { PenalCode } from "@snailycad/types";
import { TabsContent } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import type { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";
import { PenalCodesTable } from "../../penal-codes-table";
import { SelectPenalCode } from "../../select-penal-code";

interface ViolationsTabProps {
  isReadOnly?: boolean;
  penalCodes: PenalCode[];
}

interface _FormikContext {
  violations: SelectValue<PenalCode>[];
}

export function ViolationsTab(props: ViolationsTabProps) {
  const t = useTranslations("Leo");
  const { handleChange, values } = useFormikContext<_FormikContext>();

  return (
    <TabsContent value="violations-tab">
      <header className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("violations")}</h3>
      </header>

      <FormField label={t("violations")}>
        <SelectPenalCode
          isReadOnly={props.isReadOnly}
          penalCodes={props.penalCodes}
          value={values.violations}
          handleChange={handleChange}
        />
      </FormField>

      <PenalCodesTable
        isReadOnly={props.isReadOnly}
        penalCodes={values.violations.map((v) => v.value)}
      />
    </TabsContent>
  );
}
