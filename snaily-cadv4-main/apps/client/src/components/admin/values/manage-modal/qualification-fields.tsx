import { useFormikContext } from "formik";
import { ImageSelectInput } from "components/form/inputs/ImageSelectInput";
import { useValues } from "context/ValuesContext";
import { SelectField, TextField } from "@snailycad/ui";
import { QualificationValueType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import type { ManageValueFormValues } from "../ManageValueModal";

export function QualificationFields({ image, setImage }: any) {
  const { values, errors, setFieldValue } = useFormikContext<ManageValueFormValues>();
  const { department } = useValues();
  const t = useTranslations("Values");
  const common = useTranslations("Common");

  const TYPES = [
    { label: t("qualification"), value: QualificationValueType.QUALIFICATION },
    { label: t("award"), value: QualificationValueType.AWARD },
  ];

  return (
    <>
      <SelectField
        errorMessage={errors.qualificationType as string}
        label={common("type")}
        name="qualificationType"
        options={TYPES}
        onSelectionChange={(key) => setFieldValue("qualificationType", key)}
        isClearable={false}
        selectedKey={values.qualificationType}
      />

      <SelectField
        errorMessage={errors.qualificationType as string}
        label={t("departments")}
        selectionMode="multiple"
        options={department.values.map((v) => ({
          label: v.value.value,
          value: v.id,
        }))}
        onSelectionChange={(keys) => setFieldValue("departments", keys)}
        selectedKeys={values.departments}
      />

      <TextField
        isOptional
        errorMessage={errors.description as string}
        label={common("description")}
        isTextarea
        value={values.description}
        onChange={(value) => setFieldValue("description", value)}
      />

      <ImageSelectInput image={image} setImage={setImage} />
    </>
  );
}
