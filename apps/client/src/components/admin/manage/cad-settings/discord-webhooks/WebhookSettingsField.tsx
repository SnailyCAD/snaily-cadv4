import { Select } from "components/form/Select";
import { SettingsFormField } from "components/form/SettingsFormField";
import { Textarea, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { useFormikContext } from "formik";
import type { GetCADDiscordWebhooksData } from "@snailycad/types/api";

interface FieldProps {
  description?: string;
  label: string;
  fieldName: string;
  channels?: GetCADDiscordWebhooksData;
  isRawWebhook?: boolean;
}

export function WebhookSettingsField({
  description,
  label,
  channels,
  fieldName,
  isRawWebhook,
}: FieldProps) {
  const { errors, values, handleChange } = useFormikContext<any>();

  return (
    <SettingsFormField
      description={description}
      errorMessage={(errors[fieldName] as any)?.id}
      label={label}
    >
      {isRawWebhook ? (
        <TextField type="url" label={label} value={values[fieldName].url} />
      ) : (
        <>
          <Select
            isClearable
            values={(channels ?? []).map((role) => ({
              value: role.id,
              label: role.name,
            }))}
            value={values[fieldName]?.id}
            name={`${fieldName}.id`}
            onChange={handleChange}
          />

          <FormField optional className="mt-2" label="Extra message">
            <Textarea
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
