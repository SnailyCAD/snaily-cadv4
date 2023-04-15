import { FormField } from "components/form/FormField";
import { SelectField, SwitchField, TextField } from "@snailycad/ui";
import { Select } from "components/form/Select";
import { useFormikContext } from "formik";
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
      <SelectField
        label="Type"
        options={DEPARTMENT_TYPES}
        name="type"
        onSelectionChange={(key) => setFieldValue("type", key)}
        selectedKey={values.type}
      />

      <TextField
        label="Callsign Symbol"
        isOptional
        name="callsign"
        onChange={(value) => setFieldValue("callsign", value)}
        value={values.callsign}
      />

      <FormField optional errorMessage={errors.defaultOfficerRankId as string} label="Default Rank">
        <Select
          isClearable
          onChange={handleChange}
          name="defaultOfficerRankId"
          value={values.defaultOfficerRankId}
          values={officerRank.values.map((v) => ({
            label: v.value,
            value: v.id,
          }))}
        />
      </FormField>

      <SwitchField
        isSelected={values.whitelisted}
        onChange={(isSelected) => {
          isSelected && setFieldValue("isDefaultDepartment", false);
          setFieldValue("whitelisted", isSelected);
        }}
      >
        Whitelisted
      </SwitchField>

      <div className="flex flex-col">
        <SwitchField
          isSelected={values.isDefaultDepartment}
          onChange={(isSelected) => {
            isSelected && setFieldValue("whitelisted", false);
            setFieldValue("isDefaultDepartment", isSelected);
          }}
        >
          Default Department
        </SwitchField>

        <p className="text-base italic">
          When a department is whitelisted, you can set 1 department as default. This department
          will be given to the officer when they are awaiting access or when they were declined.
        </p>
      </div>

      {values.type === DepartmentType.LEO ? (
        <div className="flex flex-col mt-3">
          <SwitchField
            isSelected={values.isConfidential}
            onChange={(isSelected) => {
              isSelected && setFieldValue("isConfidential", false);
              setFieldValue("isConfidential", isSelected);
            }}
          >
            Is Confidential
          </SwitchField>

          <p className="text-base italic">
            When a department is confidential, other officers will not be able to view information
            of other officers within this department.
          </p>
        </div>
      ) : null}

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
