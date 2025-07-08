import * as React from "react";
import { TextField, FormRow } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { ImageSelectInput } from "components/form/inputs/ImageSelectInput";
import { CallSignPreview } from "../CallsignPreview";
import { ValueType, type Officer } from "@snailycad/types";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";

import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { getUnitDepartment } from "lib/utils";
import { useTranslations } from "use-intl";
import { makeDivisionsObjectMap } from "../modals/ManageOfficerModal";
import { useValues } from "context/ValuesContext";
import { AdvancedSettings } from "../modals/AdvancedSettings";
import { ValueSelectField } from "components/form/inputs/value-select-field";

interface ManageOfficerFieldsProps {
  hideCitizenField?: boolean;
  image?: File | string | null;
  setImage?: React.Dispatch<React.SetStateAction<File | string | null>>;
}

export function ManageOfficerFields({
  hideCitizenField,
  image,
  setImage,
}: ManageOfficerFieldsProps) {
  const { department, division } = useValues();
  const { setFieldValue, handleChange, errors, values } =
    useFormikContext<ReturnType<typeof getManageOfficerFieldsDefaults>>();
  const t = useTranslations("Leo");
  const { DIVISIONS, BADGE_NUMBERS } = useFeatureEnabled();

  return (
    <>
      {setImage && typeof image !== "undefined" ? (
        <ImageSelectInput setImage={setImage} image={image} />
      ) : null}

      {hideCitizenField ? null : (
        <CitizenSuggestionsField
          autoFocus
          allowsCustomValue
          label={t("citizen")}
          fromAuthUserOnly
          labelFieldName="name"
          valueFieldName="citizenId"
        />
      )}

      {BADGE_NUMBERS ? (
        <TextField
          errorMessage={errors.badgeNumberString}
          label={t("badgeNumber")}
          name="badgeNumberString"
          onChange={(value) => setFieldValue("badgeNumberString", value)}
          value={values.badgeNumberString}
        />
      ) : null}

      <FormRow>
        <TextField
          errorMessage={errors.callsign}
          label={t("callsign1")}
          name="callsign"
          onChange={(value) => setFieldValue("callsign", value)}
          value={values.callsign}
        />

        <TextField
          errorMessage={errors.callsign2}
          label={t("callsign2")}
          name="callsign2"
          onChange={(value) => setFieldValue("callsign2", value)}
          value={values.callsign2}
        />
      </FormRow>

      <ValueSelectField
        values={department.values}
        label={t("department")}
        fieldName="department"
        valueType={ValueType.DEPARTMENT}
        filterFn={(value) => value.type === "LEO"}
      />

      {DIVISIONS ? (
        <FormField errorMessage={errors.divisions as string} label={t("division")}>
          <Select
            isMulti
            value={values.divisions}
            name="divisions"
            onChange={handleChange}
            values={division.values
              .filter((v) => (values.department ? v.departmentId === values.department : true))
              .map((value) => ({
                label: value.value.value,
                value: value.id,
              }))}
          />
        </FormField>
      ) : null}

      <CallSignPreview
        divisions={division.values.filter((v) => values.divisions.some((d) => d.value === v.id))}
        department={department.values.find((v) => v.id === values.department) ?? null}
      />

      <AdvancedSettings />
    </>
  );
}

interface GetManageOfficerFieldsDefaultsOptions {
  officer: Officer | null;
  features: ReturnType<typeof useFeatureEnabled>;
}

export function getManageOfficerFieldsDefaults(options: GetManageOfficerFieldsDefaultsOptions) {
  return {
    department: getUnitDepartment(options.officer)?.id ?? "",
    rank: options.officer?.rankId ?? "",
    callsign: options.officer?.callsign ?? "",
    callsign2: options.officer?.callsign2 ?? "",
    divisions: options.officer?.divisions.map((v) => ({ value: v.id, label: v.value.value })) ?? [],
    badgeNumberString: options.features.BADGE_NUMBERS
      ? (options.officer?.badgeNumberString ?? "")
      : undefined,
    citizenId: options.officer?.citizenId ?? "",
    name: options.officer
      ? `${options.officer.citizen.name} ${options.officer.citizen.surname}`
      : "",
    image: undefined,
    callsigns: options.officer ? makeDivisionsObjectMap(options.officer) : {},
  };
}
