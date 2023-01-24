import { FormField } from "components/form/FormField";
import { TextField } from "@snailycad/ui";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";

export function DivisionFields() {
  const { values, errors, setFieldValue, handleChange } = useFormikContext<any>();
  const { department } = useValues();

  return (
    <>
      <FormField label="Department">
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
        label="Value"
        name="value"
        onChange={(value) => setFieldValue("value", value)}
        value={values.value}
      />

      <TextField
        isOptional
        errorMessage={errors.callsign as string}
        label="Callsign Symbol"
        name="callsign"
        onChange={(value) => setFieldValue("callsign", value)}
        value={values.callsign}
      />

      <TextField
        isOptional
        errorMessage={errors.pairedUnitTemplate as string}
        label="Paired Unit Template"
        name="pairedUnitTemplate"
        onChange={(value) => setFieldValue("pairedUnitTemplate", value)}
        value={values.pairedUnitTemplate}
      />

      <TextField
        isTextarea
        isOptional
        errorMessage={errors.extraFields as string}
        label="Extra Fields - JSON"
        name="extraFields"
        onChange={(value) => setFieldValue("extraFields", value)}
        value={values.extraFields}
        placeholder="JSON"
      />
    </>
  );
}
