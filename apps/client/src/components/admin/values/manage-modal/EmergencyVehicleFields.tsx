import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";

export function EmergencyVehicleFields() {
  const { values, handleChange } = useFormikContext<any>();
  const { division, department } = useValues();

  return (
    <>
      <FormField label="Departments">
        <Select
          closeMenuOnSelect={false}
          isMulti
          values={department.values.map((v) => ({
            value: v.id,
            label: v.value.value,
          }))}
          name="departments"
          onChange={handleChange}
          value={values.departments}
        />
      </FormField>

      <FormField label="Divisions">
        <Select
          closeMenuOnSelect={false}
          isMulti
          values={division.values.map((v) => ({
            value: v.id,
            label: v.value.value,
          }))}
          name="divisions"
          onChange={handleChange}
          value={values.divisions}
        />
      </FormField>
    </>
  );
}
