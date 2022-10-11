import * as React from "react";
import { useFormikContext } from "formik";
import { FormField } from "components/form/FormField";
import { ImageSelectInput } from "components/form/inputs/ImageSelectInput";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { SelectField, Textarea } from "@snailycad/ui";
import { QualificationValueType } from "@snailycad/types";

export function QualificationFields({ image, setImage }: any) {
  const { values, errors, setFieldValue, handleChange } = useFormikContext<any>();
  const { department } = useValues();

  const TYPES = [
    { label: "Qualification", value: QualificationValueType.QUALIFICATION },
    { label: "Award", value: QualificationValueType.AWARD },
  ];

  return (
    <>
      <SelectField
        errorMessage={errors.qualificationType as string}
        label="Type"
        name="qualificationType"
        options={TYPES}
        onSelectionChange={(key) => setFieldValue("qualificationType", key)}
        isClearable={false}
        selectedKey={values.qualificationType}
      />

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

      <FormField optional errorMessage={errors.description as string} label="Description">
        <Textarea value={values.description} name="description" onChange={handleChange} />
      </FormField>

      <ImageSelectInput image={image} setImage={setImage} />
    </>
  );
}
