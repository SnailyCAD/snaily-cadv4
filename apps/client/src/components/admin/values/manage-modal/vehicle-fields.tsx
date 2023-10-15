import { useFormikContext } from "formik";
import { ImageSelectInput } from "components/form/inputs/ImageSelectInput";
import { useValues } from "context/ValuesContext";
import { SelectField } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import type { ManageValueFormValues } from "../ManageValueModal";

export function VehicleFields({ image, setImage }: any) {
  const { values, errors, setFieldValue } = useFormikContext<ManageValueFormValues>();
  const { vehicleTrimLevel } = useValues();
  const t = useTranslations("Values");

  return (
    <>
      <SelectField
        isOptional
        isClearable
        selectionMode="multiple"
        errorMessage={errors.trimLevels}
        label={t("trimLevels")}
        options={vehicleTrimLevel.values.map((trimLevel) => ({
          value: trimLevel.id,
          label: trimLevel.value,
        }))}
        selectedKeys={values.trimLevels}
        onSelectionChange={(keys) => setFieldValue("trimLevels", keys)}
      />

      <ImageSelectInput image={image} setImage={setImage} />
    </>
  );
}
