import { Input } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFormikContext } from "formik";

export function LicenseNumbersSection() {
  const { errors, values, handleChange } = useFormikContext<any>();

  return (
    <section>
      <header className="mb-3">
        <h3 className="font-semibold text-xl">Citizen License Numbers</h3>
        <p className="text-neutral-700 dark:text-gray-400">
          Manage the lengths of the citizen license numbers.
        </p>
      </header>

      <SettingsFormField
        errorMessage={errors.driversLicenseNumberLength}
        description="The length of the drivers license number (Default: 8)"
        label="Drivers License Number Length"
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
        description="The length of the weapon license number (Default: 8)"
        label="Weapon License Number Length"
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
        description="The length of the pilot license number (Default: 6)"
        label="Pilot License Number Length"
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
        description="The length of the water license number (Default: 8)"
        label="Water License Number Length"
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
