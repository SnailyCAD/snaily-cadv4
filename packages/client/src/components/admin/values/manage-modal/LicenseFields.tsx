import { ValueLicenseType } from "@snailycad/types";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Toggle } from "components/form/Toggle";
import { useFormikContext } from "formik";

export const LICENSE_LABELS = {
  [ValueLicenseType.LICENSE]: "License",
  [ValueLicenseType.REGISTRATION_STATUS]: "Registration Status",
};

const LICENSE_TYPES = Object.values(ValueLicenseType).map((v) => ({
  label: LICENSE_LABELS[v] as string,
  value: v,
}));

export function LicenseFields() {
  const { values, errors, handleChange } = useFormikContext<any>();

  return (
    <>
      <FormField errorMessage={errors.licenseType as string} label="Type">
        <Select
          isClearable
          name="licenseType"
          onChange={handleChange}
          value={values.licenseType}
          values={LICENSE_TYPES}
        />

        <ul className="mt-5">
          <li className="my-1.5 text-base italic">
            - <b>None:</b>{" "}
            {
              /* eslint-disable-next-line quotes */
              'Type is both a "License" and "Registration Status". Both can be used anywhere.'
            }
          </li>
          <li className="my-1.5 text-base italic">
            - <b>License:</b> can only be used as a license when setting a citizen drivers license,
            firearms license, etc
          </li>
          <li className="my-1.5 text-base italic">
            - <b>Registration Status:</b> can only be used when setting a registration status on a
            vehicle or weapon.
          </li>
        </ul>
      </FormField>

      <FormField checkbox errorMessage={errors.isDefault as string} label="Is default license">
        <Toggle name="isDefault" toggled={values.isDefault ?? false} onClick={handleChange} />
      </FormField>
    </>
  );
}
