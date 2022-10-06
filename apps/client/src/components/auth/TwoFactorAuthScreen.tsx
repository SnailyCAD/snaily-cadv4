import * as React from "react";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import useDigitInput from "react-digit-input";
import { Button, Loader, Input } from "@snailycad/ui";
import { FormField } from "components/form/FormField";

interface Props {
  errorMessage?: string;
  isLoading: boolean;
}

export function TwoFactorAuthScreen({ isLoading, errorMessage }: Props) {
  const { setFieldValue, submitForm } = useFormikContext();

  const [value, onChange] = React.useState("");
  const t = useTranslations("Auth");
  const common = useTranslations("Common");
  const digits = useDigitInput({
    acceptedCharacters: /^[0-9]$/,
    length: 6,
    value,
    onChange,
  });

  function handleCancel() {
    setFieldValue("totpCode", undefined);
  }

  React.useEffect(() => {
    if (value) setFieldValue("totpCode", value);
  }, [value, setFieldValue]);

  React.useEffect(() => {
    if (value.trim().length === 6) {
      submitForm();
    }
  }, [value, submitForm]);

  const className = "h-[60px] w-full text-xl text-center";

  return (
    <>
      <h1 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white">
        {t("twoFactorCode")}
      </h1>

      <p className="dark:text-gray-300 my-4">{t("sixDigitCode")}</p>

      <FormField errorMessage={errorMessage} label={t("totpCode")}>
        <input hidden type="hidden" value={value} name="totpCode" />

        <div className="flex flex-row space-x-1">
          <Input className={className} name="code1" inputMode="decimal" {...digits[0]} autoFocus />
          <Input className={className} name="code2" inputMode="decimal" {...digits[1]} />
          <Input className={className} name="code3" inputMode="decimal" {...digits[2]} />
          <Input className={className} name="code4" inputMode="decimal" {...digits[3]} />
          <Input className={className} name="code5" inputMode="decimal" {...digits[4]} />
          <Input className={className} name="code6" inputMode="decimal" {...digits[5]} />
        </div>
      </FormField>

      <div className="flex gap-2 justify-end mt-8">
        <Button type="button" onPress={handleCancel}>
          {common("cancel")}
        </Button>

        <Button disabled={isLoading} className="flex items-center gap-2" type="submit">
          {isLoading ? <Loader /> : null}
          {t("login")}
        </Button>
      </div>
    </>
  );
}
