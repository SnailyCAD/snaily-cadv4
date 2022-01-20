import * as React from "react";
import { classNames } from "lib/classNames";

export type ButtonProps = JSX.IntrinsicElements["button"] & {
  small?: boolean;
  variant?: keyof typeof variants | null;
};

const variants = {
  default:
    "bg-gray-500 hover:bg-gray-600 text-white dark:hover:bg-gray-3 dark:bg-dark-bright dark:text-white",
  cancel: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200",
  danger: "bg-red-500 hover:bg-red-600 text-black",
  success: "bg-emerald-500 hover:bg-emerald-600 text-black",
  transparent: "bg-transparent text-black dark:text-white",
  link: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200 px-0 p-1 underline",
  blue: "bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
