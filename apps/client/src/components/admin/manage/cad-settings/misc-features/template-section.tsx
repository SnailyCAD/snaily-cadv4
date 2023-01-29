import { Input } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFormikContext } from "formik";
import { useTranslations } from "use-intl";

const CALLSIGN_TEMPLATE_VARIABLES = (
  <span key="CALLSIGN_TEMPLATE_VARIABLES">
    <code>{"{department}"}</code>,<code>{"{division}"}</code>, <code>{"{callsign}"}</code>,{" "}
    <code>{"{callsign2}"}</code>
  </span>
);

const CASE_NUMBER_TEMPLATE_VARIABLES = (
  <span key="CASE_NUMBER_TEMPLATE_VARIABLES">
    <code>{"{id}"}</code>, <code>{"{department}"}</code>, <code>{"{year}"}</code>,{" "}
    <code>{"{month}"}</code>, <code>{"{day}"}</code>
  </span>
);

const LICENSE_NUMBER_TEMPLATE_VARIABLES = (
  <span key="LICENSE_NUMBER_TEMPLATE_VARIABLES">
    <code>{"{letter/<length>}"}</code>, <code>{"{number/<length>}"}</code>
  </span>
);

export function TemplateSection() {
  const { errors, values, handleChange } = useFormikContext<any>();
  const t = useTranslations("CadSettings");

  const licenseNumberTypes = [
    "driversLicenseTemplate",
    "pilotLicenseTemplate",
    "weaponLicenseTemplate",
    "waterLicenseTemplate",
  ];

  return (
    <section>
      <h3 className="font-semibold text-xl mb-3">{t("templateSection")}</h3>

      <SettingsFormField
        description={t.rich("callsignTemplateInfo", {
          // @ts-expect-error this is a valid element
          variables: CALLSIGN_TEMPLATE_VARIABLES,
        })}
        label={t("callsignTemplate")}
        errorMessage={errors.callsignTemplate}
      >
        <Input name="callsignTemplate" value={values.callsignTemplate} onChange={handleChange} />
      </SettingsFormField>

      <SettingsFormField
        errorMessage={errors.caseNumberTemplate}
        description={t.rich("caseNumberTemplateInfo", {
          // @ts-expect-error this is a valid element
          variables: CASE_NUMBER_TEMPLATE_VARIABLES,
        })}
        label={t("caseNumberTemplate")}
      >
        <Input
          name="caseNumberTemplate"
          value={values.caseNumberTemplate}
          onChange={handleChange}
        />
      </SettingsFormField>

      <SettingsFormField
        errorMessage={errors.pairedUnitTemplate}
        description={t.rich("pairedUnitTemplateInfo", {
          // @ts-expect-error this is a valid element
          variables: CALLSIGN_TEMPLATE_VARIABLES,
        })}
        label={t("pairedUnitTemplate")}
      >
        <Input
          name="pairedUnitTemplate"
          value={values.pairedUnitTemplate}
          onChange={handleChange}
        />
      </SettingsFormField>

      {licenseNumberTypes.map((type) => (
        <SettingsFormField
          key={type}
          errorMessage={errors[type]}
          description={t.rich(`${type}Info`, {
            // @ts-expect-error this is a valid element
            variables: LICENSE_NUMBER_TEMPLATE_VARIABLES,
          })}
          label={t(type)}
        >
          <Input
            placeholder="L{number/3}-{number/6}"
            name={type}
            value={values[type]}
            onChange={handleChange}
          />
        </SettingsFormField>
      ))}
    </section>
  );
}
