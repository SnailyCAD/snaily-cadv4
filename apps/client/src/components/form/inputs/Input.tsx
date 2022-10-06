import { Button, Input } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import * as React from "react";

type Props = Omit<JSX.IntrinsicElements["input"], "id"> & {
  errorMessage?: string;
};

// todo: move to separate file.
export function PasswordInput(props: Omit<Props, "type" | "ref">) {
  const [type, setType] = React.useState("password");
  const ref = React.useRef<HTMLInputElement>(null);
  const common = useTranslations("Common");

  function handleClick() {
    setType((p) => (p === "password" ? "text" : "password"));

    if (ref.current) {
      ref.current.focus();
    }
  }

  return (
    <div className="relative">
      <Input {...props} type={type} ref={ref} />
      <Button
        type="button"
        onPress={handleClick}
        size="xs"
        className="absolute -translate-y-1/2 bg-gray-300 top-1/2 right-2 dark:bg-tertiary"
      >
        {type === "password" ? common("show") : common("hide")}
      </Button>
    </div>
  );
}

PasswordInput.displayName = "__Input__";
Input.displayName = "__Input__";
