import { Input } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFormikContext } from "formik";

export function InactivityTimeoutSection() {
  const { errors, values, handleChange } = useFormikContext<any>();

  return (
    <section>
      <h3 className="font-semibold text-xl mb-3">Inactivity Timeouts</h3>

      <SettingsFormField
        optional
        action="short-input"
        label="911-call Inactivity Timeout"
        description="Calls that have not been updated after this timeout will be automatically ended. The format must be in minutes. (Default: none)"
        errorMessage={errors.call911InactivityTimeout}
      >
        <Input
          type="number"
          name="call911InactivityTimeout"
          value={values.call911InactivityTimeout}
          onChange={handleChange}
          placeholder="120"
        />
      </SettingsFormField>

      <SettingsFormField
        optional
        action="short-input"
        label="Incident Inactivity Timeout"
        description="Incidents that have not been updated after this timeout will be automatically ended. The format must be in minutes. (Default: none)"
        errorMessage={errors.incidentInactivityTimeout}
      >
        <Input
          type="number"
          name="incidentInactivityTimeout"
          value={values.incidentInactivityTimeout}
          onChange={handleChange}
          placeholder="120"
        />
      </SettingsFormField>

      <SettingsFormField
        optional
        action="short-input"
        label="Unit Inactivity Timeout"
        description="Units that have not been updated after this timeout will be automatically set off-duty. The format must be in minutes. (Default: none)"
        errorMessage={errors.unitInactivityTimeout}
      >
        <Input
          type="number"
          name="unitInactivityTimeout"
          value={values.unitInactivityTimeout}
          onChange={handleChange}
          placeholder="120"
        />
      </SettingsFormField>

      <SettingsFormField
        optional
        action="short-input"
        label="Active Dispatcher Inactivity Timeout"
        description="Active Dispatchers that have not been updated after this timeout will be automatically set off-duty. The format must be in minutes. (Default: none)"
        errorMessage={errors.activeDispatchersInactivityTimeout}
      >
        <Input
          type="number"
          name="activeDispatchersInactivityTimeout"
          value={values.activeDispatchersInactivityTimeout}
          onChange={handleChange}
          placeholder="120"
        />
      </SettingsFormField>

      <SettingsFormField
        optional
        action="short-input"
        label="BOLO Inactivity Timeout"
        description="BOLOs that have not been updated after this timeout will be automatically ended. The format must be in minutes. (Default: none)"
        errorMessage={errors.boloInactivityTimeout}
      >
        <Input
          type="number"
          name="boloInactivityTimeout"
          value={values.boloInactivityTimeout}
          onChange={handleChange}
          placeholder="120"
        />
      </SettingsFormField>

      <SettingsFormField
        optional
        action="short-input"
        label="Active Warrants Inactivity Timeout"
        description="Active Warrants that have not been updated after this timeout will be automatically set as non-active. The format must be in minutes. (Default: none)"
        errorMessage={errors.activeWarrantsInactivityTimeout}
      >
        <Input
          type="number"
          name="activeWarrantsInactivityTimeout"
          value={values.activeWarrantsInactivityTimeout}
          onChange={handleChange}
          placeholder="120"
        />
      </SettingsFormField>
    </section>
  );
}
