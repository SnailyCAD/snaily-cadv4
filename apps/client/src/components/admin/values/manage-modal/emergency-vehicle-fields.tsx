import type { EmergencyVehicleValue } from "@snailycad/types";
import { SelectField } from "@snailycad/ui";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "use-intl";

export function useDefaultDivisions() {
  const { division } = useValues();

  const DEFAULT_DIVISIONS = division.values.map((value) => value.id);

  function makeDefaultDivisions(value: EmergencyVehicleValue | null) {
    if (!value) return [];

    const divisions = value.divisions ?? [];
    return divisions.length <= 0 ? DEFAULT_DIVISIONS : divisions.map((value) => value.id);
  }

  return makeDefaultDivisions;
}

export function EmergencyVehicleFields() {
  const { values, setFieldValue } = useFormikContext<any>();
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
          options={division.values.map((v) => ({
            label: v.value.value,
            value: v.id,
          }))}
          onSelectionChange={(keys) => setFieldValue("divisions", keys)}
          selectedKeys={values.divisions}
        />
      ) : null}
    </>
  );
}
