import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Select } from "components/form/Select";
import { useFormikContext } from "formik";
import { Toggle } from "components/form/Toggle";
import { DepartmentType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";

export const DEPARTMENT_LABELS = {
  [DepartmentType.LEO]: "LEO",
  [DepartmentType.EMS_FD]: "EMS/FD",
};
const DEPARTMENT_TYPES = Object.values(DepartmentType).map((v) => ({
  label: DEPARTMENT_LABELS[v] as string,
  value: v,
}));

export function DepartmentFields() {
  const { values, errors, setFieldValue, handleChange } = useFormikContext<any>();
  const { officerRank } = useValues();

  return (
    <>
      <FormField label="Type">
        <Select values={DEPARTMENT_TYPES} name="type" onChange={handleChange} value={values.type} />
      </FormField>

      <FormField optional label="Callsign Symbol">
        <Input name="callsign" onChange={handleChange} value={values.callsign} />
      </FormField>

      {values.type === DepartmentType.LEO ? (
        <>
          <FormField
            optional
            errorMessage={errors.defaultOfficerRank as string}
            label="Default Officer Rank"
          >
            <Select
              isClearable
              onChange={handleChange}
              name="defaultOfficerRank"
              value={values.defaultOfficerRank}
              values={officerRank.values.map((v) => ({
                label: v.value,
                value: v.id,
              }))}
            />
          </FormField>

          <FormField errorMessage={errors.whitelisted as string} checkbox label="Whitelisted">
            <Toggle
              name="whitelisted"
              toggled={values.whitelisted}
              onClick={(e) => {
                e.target.value && setFieldValue("isDefaultDepartment", false);
                handleChange(e);
              }}
            />
          </FormField>

          <div className="flex flex-col">
            <FormField
              errorMessage={errors.isDefaultDepartment as string}
              checkbox
              label="Default Department"
            >
              <Toggle
                name="isDefaultDepartment"
                toggled={values.isDefaultDepartment}
                onClick={(e) => {
                  e.target.value && setFieldValue("whitelisted", false);
                  handleChange(e);
                }}
              />
            </FormField>

            <p className="text-base italic">
              When a department is whitelisted, you can set 1 department as default. This department
              will be given to the officer when they are awaiting access or when they were declined.
            </p>
          </div>
        </>
      ) : null}
    </>
  );
}
