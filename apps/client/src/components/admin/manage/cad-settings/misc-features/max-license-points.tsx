import { Input } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";

export function MaxLicensePointsSection() {
  const { errors, values, handleChange } = useFormikContext<{
    driversLicenseMaxPoints: number;
    pilotLicenseMaxPoints: number;
    weaponLicenseMaxPoints: number;
    waterLicenseMaxPoints: number;
  }>();
  const t = useTranslations("MiscSettingsTab");

  return (
    <section>
      <header className="mb-3">
        <h3 className="font-semibold text-xl">{t("maxLicensePoints")}</h3>
        <p className="text-neutral-700 dark:text-gray-400">{t("maxLicensePointsDescription")}</p>
      </header>

      <SettingsFormField
        errorMessage={errors.driversLicenseMaxPoints}
        label={t("maxDriverLicensePoints")}
        description={t("maxDriverLicensePointsDescription")}
        action="short-input"
      >
        <Input
          type="number"
          name="driversLicenseMaxPoints"
          value={values.driversLicenseMaxPoints}
          onChange={handleChange}
        />
      </SettingsFormField>

      <SettingsFormField
        errorMessage={errors.pilotLicenseMaxPoints}
        label={t("maxPilotLicensePoints")}
        description={t("maxPilotLicensePointsDescription")}
        action="short-input"
      >
        <Input
          type="number"
          name="pilotLicenseMaxPoints"
          value={values.pilotLicenseMaxPoints}
          onChange={handleChange}
        />
      </SettingsFormField>

      <SettingsFormField
        errorMessage={errors.weaponLicenseMaxPoints}
        label={t("maxWeaponLicensePoints")}
        description={t("maxWeaponLicensePointsDescription")}
        action="short-input"
      >
        <Input
          type="number"
          name="weaponLicenseMaxPoints"
          value={values.weaponLicenseMaxPoints}
          onChange={handleChange}
        />
      </SettingsFormField>

      <SettingsFormField
        errorMessage={errors.waterLicenseMaxPoints}
        label={t("maxWaterLicensePoints")}
        description={t("maxWaterLicensePointsDescription")}
        action="short-input"
      >
        <Input
          type="number"
          name="waterLicenseMaxPoints"
          value={values.waterLicenseMaxPoints}
          onChange={handleChange}
        />
      </SettingsFormField>
    </section>
  );
}
