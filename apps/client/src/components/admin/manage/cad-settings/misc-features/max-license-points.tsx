import { Input } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFormikContext } from "formik";

export function MaxLicensePointsSection() {
  const { errors, values, handleChange } = useFormikContext<{
    driversLicenseMaxPoints: number;
    pilotLicenseMaxPoints: number;
    weaponLicenseMaxPoints: number;
    waterLicenseMaxPoints: number;
  }>();

  return (
    <section>
      <header className="mb-3">
        <h3 className="font-semibold text-xl">Max License Points</h3>
        <p className="text-neutral-700 dark:text-gray-400">
          Define the maximum amount of license points a citizen can have before their license is
          suspended.
        </p>
      </header>

      <SettingsFormField
        errorMessage={errors.driversLicenseMaxPoints}
        description="The maximum amount of license points a citizen can have before their drivers license is suspended (Default: 12)"
        label="Max License Points"
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
        description="The maximum amount of license points a citizen can have before their pilots license is suspended (Default: 12)"
        label="Max License Points"
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
        description="The maximum amount of license points a citizen can have before their weapon license is suspended (Default: 12)"
        label="Max License Points"
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
        description="The maximum amount of license points a citizen can have before their water license is suspended (Default: 12)"
        label="Max License Points"
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
