import { Input } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";

export function InactivityTimeoutSection() {
  const { errors, values, handleChange } = useFormikContext<any>();
  const t = useTranslations("MiscSettingsTab");

  return (
    <section>
      <h3 className="font-semibold text-xl mb-3">{t("inactivityTimeouts")}</h3>

      <SettingsFormField
        optional
        action="short-input"
        label={t("911CallInactivityTimeout")}
        description={t("911CallInactivityTimeoutDescription")}
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
        label={t("incidentInactivityTimeout")}
        description={t("incidentInactivityTimeoutDescription")}
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
        label={t("unitInactivityTimeout")}
        description={t("unitInactivityTimeoutDescription")}
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
        label={t("activeDispatcherInactivityTimeout")}
        description={t("activeDispatcherInactivityTimeoutDescription")}
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
        label={t("boloInactivityTimeout")}
        description={t("boloInactivityTimeoutDescription")}
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
        label={t("activeWarrantsInactivityTimeout")}
        description={t("activeWarrantsInactivityTimeoutDescription")}
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
