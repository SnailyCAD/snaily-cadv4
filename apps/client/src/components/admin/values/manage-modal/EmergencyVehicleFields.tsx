import type { EmergencyVehicleValue } from "@snailycad/types";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

export function useDefaultDivisions() {
  const { division } = useValues();

  const DEFAULT_DIVISIONS = division.values.map((v) => ({
    value: v.id,
    label: v.value.value,
  }));

  function makeDefaultDivisions(value: EmergencyVehicleValue | null) {
    if (!value) return [];
    const divisions = value.divisions ?? [];

    return divisions.length <= 0
      ? DEFAULT_DIVISIONS
      : divisions.map((v) => ({
          label: v.value.value,
          value: v.id,
        }));
  }

  return makeDefaultDivisions;
}

export function EmergencyVehicleFields() {
  const { values, handleChange } = useFormikContext<any>();
  const { division, department } = useValues();
  const { DIVISIONS } = useFeatureEnabled();

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

      {DIVISIONS ? (
        <FormField optional label="Divisions">
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
      ) : null}
    </>
  );
}
