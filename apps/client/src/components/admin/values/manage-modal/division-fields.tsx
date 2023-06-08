import { FormField } from "components/form/FormField";
import { TextField } from "@snailycad/ui";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";

export function DivisionFields() {
  const { values, errors, setFieldValue, handleChange } = useFormikContext<any>();
  const { department } = useValues();
  const t = useTranslations("Values");

  return (
    <>
      <FormField label={t("department")}>
        <Select
          autoFocus
          values={department.values.map((v) => ({
            value: v.id,
            label: v.value.value,
          }))}
          name="departmentId"
          onChange={handleChange}
          value={values.departmentId}
        />
      </FormField>

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

      <TextField
        description={t("extraFieldsDescription")}
        isTextarea
        isOptional
        errorMessage={errors.extraFields as string}
        label={t("extraFields")}
        name="extraFields"
        onChange={(value) => setFieldValue("extraFields", value)}
        value={values.extraFields}
        placeholder="JSON"
      />
    </>
  );
}
