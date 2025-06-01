import { JsonEditor, TextField } from "@snailycad/ui";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { ValueType } from "@snailycad/types";
import type { ManageValueFormValues } from "../ManageValueModal";
import { FormField } from "components/form/FormField";

export function DivisionFields() {
  const { values, errors, setFieldValue } = useFormikContext<ManageValueFormValues>();
  const { department } = useValues();
  const t = useTranslations("Values");

  return (
    <>
      <ValueSelectField
        label={t("department")}
        fieldName="departmentId"
        values={department.values}
        valueType={ValueType.DEPARTMENT}
      />

      <TextField
        errorMessage={errors.value as string}
        label={t("value")}
        name="value"
        onChange={(value) => setFieldValue("value", value)}
        value={values.value}
      />

      <TextField
        isOptional
        errorMessage={errors.callsign as string}
        label={t("callsignSymbol")}
        name="callsign"
        onChange={(value) => setFieldValue("callsign", value)}
        value={values.callsign}
      />

      <TextField
        isOptional
        errorMessage={errors.pairedUnitTemplate as string}
        label={t("pairedUnitTemplate")}
        name="pairedUnitTemplate"
        onChange={(value) => setFieldValue("pairedUnitTemplate", value)}
        value={values.pairedUnitTemplate}
      />

      <FormField optional errorMessage={errors.extraFields as string} label={t("extraFields")}>
        <JsonEditor
          value={values.extraFields}
          onChange={(value) => setFieldValue("extraFields", value)}
        />
      </FormField>
    </>
  );
}
