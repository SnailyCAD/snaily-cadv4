import * as React from "react";

type Props = JSX.IntrinsicElements["input"] & {
  hasError?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(({ hasError, ...rest }, ref) => (
  <input
    ref={ref}
    {...rest}
    className={`
    w-full p-1.5 px-3 bg-white rounded-md border-[1.5px] border-gray-200
    outline-none focus:border-gray-800
    hover:border-dark-gray
    disabled:cursor-not-allowed disabled:opacity-80
    transition-all ${rest.className} ${hasError && "border-red-500"} `}
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
      <button
        type="button"
        onClick={handleClick}
        className="p-1 px-3 rounded-md absolute top-1/2 right-1 -translate-y-1/2 bg-gray-300"
      >
        {type === "password" ? "show" : "hide"}
      </button>
    </div>
  );
};
