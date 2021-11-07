import { Button } from "components/Button";
import { classNames } from "lib/classNames";
import * as React from "react";

type Props = JSX.IntrinsicElements["input"] & {
  hasError?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(({ hasError, ...rest }, ref) => (
  <input
    ref={ref}
    {...rest}
    className={classNames(
      `
    w-full p-1.5 px-3 bg-white rounded-md border-[1.5px] border-gray-200 dark:border-gray-600
    outline-none focus:border-gray-800 dark:focus:border-gray-200
    dark:bg-gray-2 dark:text-white
    disabled:cursor-not-allowed disabled:opacity-80
    transition-all`,
      hasError && "border-red-500",
      rest.className,
      ["checkbox", "radio"].includes(rest.type!) && "max-w-[max-content] mr-2",
    )}
  />
));

export const PasswordInput = (props: Exclude<Props, "type">) => {
  const [type, setType] = React.useState("password");
  const ref = React.useRef<HTMLInputElement>(null);

  function handleClick() {
    setType((p) => (p === "password" ? "text" : "password"));

    if (ref.current) {
      ref.current.focus();
    }
  }

  return (
    <div className="relative">
      <Input ref={ref} type={type} {...(props as any)} />
      <Button
        type="button"
        onClick={handleClick}
        small
        className="absolute -translate-y-1/2 bg-gray-300 top-1/2 right-2 dark:bg-gray-3"
      >
        {type === "password" ? "show" : "hide"}
      </Button>
    </div>
  );
};
