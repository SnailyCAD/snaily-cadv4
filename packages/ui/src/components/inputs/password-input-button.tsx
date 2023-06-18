import * as React from "react";
import { Button } from "../button/button";
import { useTranslations } from "next-intl";

export function PasswordInputButton({ inputRef }: { inputRef: React.RefObject<HTMLInputElement> }) {
  const [passwordShown, setPasswordShown] = React.useState(false);
  const common = useTranslations("Common");

  function handleToggle() {
    if (!inputRef.current) return;

    inputRef.current.type = passwordShown ? "password" : "text";
    setPasswordShown((p) => !p);
  }

  return (
    <Button
      onPress={handleToggle}
      size="xs"
      className="absolute bg-gray-300 top-[32px] right-1 dark:bg-tertiary w-fit"
    >
      {passwordShown ? common("hide") : common("show")}
    </Button>
  );
}
