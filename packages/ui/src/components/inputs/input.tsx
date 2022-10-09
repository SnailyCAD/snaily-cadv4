import * as React from "react";

type Props = Omit<JSX.IntrinsicElements["input"], "id"> & {
  errorMessage?: string;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(({ errorMessage, ...rest }, ref) => (
  <input
    ref={ref}
    {...rest}
    className={`
    w-full p-1.5 px-3 bg-white rounded-md border
    outline-none focus:border-gray-800 dark:focus:border-gray-500
    dark:bg-secondary dark:text-white
    disabled:cursor-not-allowed disabled:opacity-80
    placeholder:opacity-50
    transition-all ${rest.className} ${
      errorMessage
        ? "border-red-500 focus:border-red-700 dark:focus:border-red-700"
        : "border-gray-200 dark:border-gray-700"
    } `}
  />
));
