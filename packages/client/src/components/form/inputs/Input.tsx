import { Button } from "components/Button";
import { useTranslations } from "next-intl";
import * as React from "react";

type Props = Omit<JSX.IntrinsicElements["input"], "id"> & {
  errorMessage?: string;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(({ errorMessage, ...rest }, ref) => (
  <input
    ref={ref}
    {...rest}
    className={`
    w-full p-1.5 px-3 bg-white rounded-md border-[1.5px]
    outline-none focus:border-gray-800 dark:focus:border-gray-200
    dark:bg-gray-2 dark:text-white
    disabled:cursor-not-allowed disabled:opacity-80
    placeholder:opacity-50
    transition-all ${rest.className} ${
      errorMessage
        ? "border-red-500 focus:border-red-700 dark:focus:border-red-700"
        : "border-gray-200 dark:border-gray-600"
    } `}
  />
));

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
        onClick={handleClick}
        size="xs"
        className="absolute -translate-y-1/2 bg-gray-300 top-1/2 right-2 dark:bg-gray-3"
      >
        {type === "password" ? common("show") : common("hide")}
      </Button>
    </div>
  );
}

PasswordInput.displayName = "__Input__";
Input.displayName = "__Input__";
