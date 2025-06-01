import type { AnyValue } from "@snailycad/types";
import { JsonEditor, SelectField, TextField } from "@snailycad/ui";
import { isEmergencyVehicleValue } from "@snailycad/utils";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "use-intl";
import type { ManageValueFormValues } from "../ManageValueModal";
import { FormField } from "components/form/FormField";

export function useDefaultDivisions() {
  const { division } = useValues();
  const DEFAULT_DIVISIONS = division.values.map((value) => value.id);

  function makeDefaultDivisions(value: AnyValue | null) {
    if (!value || !isEmergencyVehicleValue(value)) return [];

    const divisions = value.divisions ?? [];
    return divisions.length <= 0 ? DEFAULT_DIVISIONS : divisions.map((value) => value.id);
  }

  return makeDefaultDivisions;
}

export function EmergencyVehicleFields() {
  const { values, errors, setFieldValue } = useFormikContext<ManageValueFormValues>();
  const { division, department } = useValues();
  const { DIVISIONS } = useFeatureEnabled();
  const t = useTranslations("Values");

  return (
    <>
      <SelectField
        label={t("departments")}
        selectionMode="multiple"
        options={department.values.map((v) => ({
          label: v.value.value,
          value: v.id,
        }))}
        onSelectionChange={(keys) => setFieldValue("departments", keys)}
        selectedKeys={values.departments}
      />

      {DIVISIONS ? (
        <SelectField
          isOptional
          isClearable
          label={t("divisions")}
          selectionMode="multiple"
          options={division.values
            .filter((value) =>
              values.departments?.length && value.departmentId
                ? values.departments.includes(value.departmentId)
                : true,
            )
            .map((v) => ({
              label: v.value.value,
              value: v.id,
            }))}
          onSelectionChange={(keys) => setFieldValue("divisions", keys)}
          selectedKeys={values.divisions}
        />
      ) : null}

      <TextField
        isTextarea
        value={values.description}
        onChange={(value) => setFieldValue("description", value)}
        label={t("description")}
      />

      <FormField optional errorMessage={errors.extraFields as string} label={t("extraFields")}>
        <JsonEditor
          value={values.extraFields}
          onChange={(value) => setFieldValue("extraFields", value)}
        />
      </FormField>
    </>
  );
}
