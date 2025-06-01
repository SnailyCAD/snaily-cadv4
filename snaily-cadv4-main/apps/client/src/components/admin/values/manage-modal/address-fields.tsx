import { TextField } from "@snailycad/ui";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";
import type { ManageValueFormValues } from "../ManageValueModal";

export function AddressFields() {
  const { values, errors, setFieldValue } = useFormikContext<ManageValueFormValues>();
  const t = useTranslations("Values");

  return (
    <>
      <TextField
        label={t("postal")}
        isOptional
        name="postal"
        onChange={(value) => setFieldValue("postal", value)}
        value={values.postal}
        errorMessage={errors.postal as string}
      />

      <TextField
        label={t("county")}
        isOptional
        name="county"
        onChange={(value) => setFieldValue("county", value)}
        value={values.county}
        errorMessage={errors.county as string}
      />
    </>
  );
}
