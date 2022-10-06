import { FormField } from "components/form/FormField";
import { Input } from "@snailycad/ui";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";

export function DivisionFields() {
  const { values, errors, handleChange } = useFormikContext<any>();
  const { department } = useValues();

  return (
    <>
      <FormField label="Department">
        <Select
          values={department.values.map((v) => ({
            value: v.id,
            label: v.value.value,
          }))}
          name="departmentId"
          onChange={handleChange}
          value={values.departmentId}
        />
      </FormField>

      <FormField errorMessage={errors.value} label="Value">
        <Input autoFocus name="value" onChange={handleChange} value={values.value} />
      </FormField>

      <FormField optional label="Callsign Symbol">
        <Input name="callsign" onChange={handleChange} value={values.callsign} />
      </FormField>

      <FormField optional label="Paired Unit Template">
        <Input
          name="pairedUnitTemplate"
          onChange={handleChange}
          value={values.pairedUnitTemplate}
        />
      </FormField>
    </>
  );
}
