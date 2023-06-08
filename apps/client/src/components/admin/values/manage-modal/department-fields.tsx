import { FormField } from "components/form/FormField";
import { SelectField, SwitchField, TextField } from "@snailycad/ui";
import { Select } from "components/form/Select";
import { useFormikContext } from "formik";
import { DepartmentType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import { useTranslations } from "use-intl";

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
  const common = useTranslations("Common");
  const t = useTranslations("Values");

  return (
    <>
      <SelectField
        label={common("type")}
        options={DEPARTMENT_TYPES}
        name="type"
        onSelectionChange={(key) => setFieldValue("type", key)}
        selectedKey={values.type}
      />

      <TextField
        label={t("callsignSymbol")}
        isOptional
        name="callsign"
        onChange={(value) => setFieldValue("callsign", value)}
        value={values.callsign}
      />

      <FormField
        optional
        errorMessage={errors.defaultOfficerRankId as string}
        label={t("defaultRank")}
      >
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
        description={t("whitelistedDescription")}
        isSelected={values.whitelisted}
        onChange={(isSelected) => {
          isSelected && setFieldValue("isDefaultDepartment", false);
          setFieldValue("whitelisted", isSelected);
        }}
      >
        {t("whitelisted")}
      </SwitchField>

      <SwitchField
        isSelected={values.isDefaultDepartment}
        onChange={(isSelected) => {
          isSelected && setFieldValue("whitelisted", false);
          setFieldValue("isDefaultDepartment", isSelected);
        }}
      >
        {t("defaultDepartment")}
      </SwitchField>

      {values.type === DepartmentType.LEO ? (
        <SwitchField
          description={t("isConfidentialDescription")}
          isSelected={values.isConfidential}
          onChange={(isSelected) => {
            isSelected && setFieldValue("isConfidential", false);
            setFieldValue("isConfidential", isSelected);
          }}
        >
          {t("isConfidential")}
        </SwitchField>
      ) : null}

      <TextField
        description={t("extraFieldsDescription")}
        isTextarea
        isOptional
        errorMessage={errors.extraFields as string}
        label={t("extraFields")}
        name="extraFields"
        onChange={(value) => setFieldValue("extraFields", value)}
        value={values.extraFields}
        placeholder="JSON"
      />
    </>
  );
}
