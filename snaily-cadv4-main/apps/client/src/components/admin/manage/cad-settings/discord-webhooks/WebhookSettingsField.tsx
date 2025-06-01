import { Select } from "components/form/Select";
import { SettingsFormField } from "components/form/SettingsFormField";
import { Textarea, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { useFormikContext } from "formik";
import type { GetCADDiscordWebhooksData } from "@snailycad/types/api";
import { useTranslations } from "use-intl";
import { type DiscordWebhookType } from "@snailycad/types";

interface FieldProps {
  description?: string;
  label: string;
  fieldName: DiscordWebhookType | (string & {});
  channels?: GetCADDiscordWebhooksData;
  isRawWebhook?: boolean;
  disabled?: boolean;
}

export function WebhookSettingsField({
  description,
  label,
  channels,
  fieldName,
  isRawWebhook,
  disabled,
}: FieldProps) {
  const { errors, values, setFieldValue, handleChange } = useFormikContext<any>();
  const t = useTranslations("DiscordWebhooksTab");

  return (
    <SettingsFormField
      description={description}
      errorMessage={(errors[fieldName] as any)?.id}
      label={label}
    >
      {isRawWebhook ? (
        <TextField
          type="url"
          label={label}
          onChange={(value) => setFieldValue(fieldName, { ...values[fieldName], url: value })}
          value={values[fieldName].url}
        />
      ) : (
        <>
          <Select
            disabled={disabled}
            isClearable
            values={(channels ?? []).map((role) => ({
              value: role.id,
              label: role.name,
            }))}
            value={values[fieldName]?.id}
            name={`${fieldName}.id`}
            onChange={handleChange}
          />

          <FormField optional className="mt-2" label={t("extraMessage")}>
            <Textarea
              disabled={disabled}
              value={values[fieldName]?.extraMessage}
              name={`${fieldName}.extraMessage`}
              onChange={handleChange}
            />
          </FormField>
        </>
      )}
    </SettingsFormField>
  );
}
