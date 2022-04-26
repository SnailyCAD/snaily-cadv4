import * as React from "react";
import { useFormikContext } from "formik";
import { FormField } from "components/form/FormField";
import { ImageSelectInput } from "components/form/inputs/ImageSelectInput";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";

export function QualificationFields({ image, setImage }: any) {
  const { values, errors, handleChange } = useFormikContext<any>();
  const { department } = useValues();

  return (
    <>
      <FormField errorMessage={errors.departments as string} label="Departments">
        <Select
          isMulti
          isClearable={false}
          values={department.values.map((v) => ({
            value: v.id,
            label: v.value.value,
          }))}
          name="departments"
          onChange={handleChange}
          value={values.departments}
          closeMenuOnSelect={false}
        />
      </FormField>

      <ImageSelectInput image={image} setImage={setImage} />
    </>
  );
}
