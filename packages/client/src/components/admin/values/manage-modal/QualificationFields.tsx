import * as React from "react";
import { useFormikContext } from "formik";
import { FormField } from "components/form/FormField";
// import { ImageSelectInput } from "components/form/inputs/ImageSelectInput";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";

export function QualificationFields() {
  const { values, errors, handleChange } = useFormikContext<any>();
  const { department } = useValues();

  return (
    <>
      <FormField errorMessage={errors.departmentId as string} label="Department">
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

      {/* <ImageSelectInput
      // todo
      /> */}
    </>
  );
}
