import * as React from "react";
import { classNames } from "lib/classNames";

type Props = JSX.IntrinsicElements["button"] & {
  small?: boolean;
  variant?: keyof typeof variants;
};

const variants = {
  default: "bg-gray-500 hover:bg-gray-600 text-white dark:bg-dark-bright dark:text-white",
  cancel: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200",
  danger: "bg-red-500 hover:bg-red-600 text-black",
  success: "bg-green-500 hover:bg-green-600 text-black",
  transparent: "bg-transparent text-black dark:text-white",
  link: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200 px-0 p-1 underline",
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = "default", small, className = "", ...rest }, ref) => (
    <button
      className={classNames(
        "rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed",
        small ? "p-0.5 px-2" : "p-1 px-4",
        variant && variants[variant],
        className,
      )}
      {...rest}
      ref={ref}
    />
  ),
);
