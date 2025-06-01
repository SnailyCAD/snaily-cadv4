import { ValueLicenseType } from "@snailycad/types";
import { SelectField, SwitchField } from "@snailycad/ui";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";
import type { ManageValueFormValues } from "../ManageValueModal";

export function useLicenseLabels() {
  const t = useTranslations("Values");

  const LICENSE_LABELS = {
    [ValueLicenseType.LICENSE]: t("license"),
    [ValueLicenseType.REGISTRATION_STATUS]: t("registrationStatus"),
    [ValueLicenseType.INSURANCE_STATUS]: t("insuranceStatus"),
  };

  const LICENSE_TYPES = Object.values(ValueLicenseType).map((v) => ({
    label: LICENSE_LABELS[v] as string,
    value: v,
  }));

  return {
    LICENSE_LABELS,
    LICENSE_TYPES,
  };
}

export function LicenseFields() {
  const { values, errors, setFieldValue } = useFormikContext<ManageValueFormValues>();
  const t = useTranslations("Values");
  const common = useTranslations("Common");
  const { LICENSE_TYPES } = useLicenseLabels();

  return (
    <>
      <SelectField
        isClearable
        errorMessage={errors.licenseType as string}
        label={common("type")}
        options={LICENSE_TYPES}
        name="licenseType"
        onSelectionChange={(key) => setFieldValue("licenseType", key)}
        selectedKey={values.licenseType}
      >
        <ul className="mt-5">
          <li className="my-1.5 text-base">
            - <b>None:</b>{" "}
            {
              /* eslint-disable-next-line quotes */
              'Type is both a "License" and "Registration Status". Both can be used anywhere.'
            }
          </li>
          <li className="my-1.5 text-base ">
            - <b>License:</b> can only be used as a license when setting a citizen drivers license,
            firearms license, etc
          </li>
          <li className="my-1.5 text-base ">
            - <b>Registration Status:</b> can only be used when setting a registration status on a
            vehicle or weapon.
          </li>
          <li className="my-1.5 text-base ">
            - <b>Insurance Status:</b> can only be used when setting an insurance status on a
            vehicle.
          </li>
        </ul>
      </SelectField>

      {!values.licenseType || values.licenseType === ValueLicenseType.LICENSE ? (
        <SwitchField
          description={t("defaultLicenseDescription")}
          isSelected={values.isDefault ?? false}
          onChange={(isSelected) => setFieldValue("isDefault", isSelected)}
        >
          {t("defaultLicense")}
        </SwitchField>
      ) : null}
    </>
  );
}
