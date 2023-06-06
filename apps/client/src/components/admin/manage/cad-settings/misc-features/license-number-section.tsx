import { Input } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";

export function LicenseNumbersSection() {
  const { errors, values, handleChange } = useFormikContext<any>();
  const t = useTranslations("MiscSettingsTab");

  return (
    <section>
      <header className="mb-3">
        <h3 className="font-semibold text-xl">{t("citizenLicenseNumbers")}</h3>
        <p className="text-neutral-700 dark:text-gray-400">
          {t("citizenLicenseNumbersDescription")}
        </p>
      </header>

      <SettingsFormField
        errorMessage={errors.driversLicenseNumberLength}
        description={t("driversLicenseNumberLengthDescription")}
        label={t("driversLicenseNumberLength")}
        action="short-input"
      >
        <Input
          type="number"
          name="driversLicenseNumberLength"
          value={values.driversLicenseNumberLength}
          onChange={handleChange}
        />
      </SettingsFormField>

      <SettingsFormField
        errorMessage={errors.weaponLicenseNumberLength}
        description={t("weaponLicenseNumberLengthDescription")}
        label={t("weaponLicenseNumberLength")}
        action="short-input"
      >
        <Input
          type="number"
          name="weaponLicenseNumberLength"
          value={values.weaponLicenseNumberLength}
          onChange={handleChange}
        />
      </SettingsFormField>

      <SettingsFormField
        errorMessage={errors.pilotLicenseNumberLength}
        description={t("pilotLicenseNumberLengthDescription")}
        label={t("pilotLicenseNumberLength")}
        action="short-input"
      >
        <Input
          type="number"
          name="pilotLicenseNumberLength"
          value={values.pilotLicenseNumberLength}
          onChange={handleChange}
        />
      </SettingsFormField>

      <SettingsFormField
        errorMessage={errors.waterLicenseNumberLength}
        description={t("waterLicenseNumberLengthDescription")}
        label={t("waterLicenseNumberLength")}
        action="short-input"
      >
        <Input
          type="number"
          name="waterLicenseNumberLength"
          value={values.waterLicenseNumberLength}
          onChange={handleChange}
        />
      </SettingsFormField>
    </section>
  );
}
