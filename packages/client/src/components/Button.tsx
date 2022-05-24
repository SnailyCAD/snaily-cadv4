import * as React from "react";
import { classNames } from "lib/classNames";

export type ButtonProps = JSX.IntrinsicElements["button"] & {
  small?: boolean;
  variant?: keyof typeof buttonVariants | null;
};

export const buttonVariants = {
  default:
    "bg-gray-500 hover:bg-gray-600 text-white dark:hover:bg-gray-3 dark:bg-dark-bright dark:text-white transition-all",
  cancel: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200 transition-all",
  danger: "bg-red-500 hover:bg-red-600 text-black transition-all",
  success: "bg-emerald-500 hover:bg-emerald-600 text-black transition-all",
  transparent: "bg-transparent text-black dark:text-white transition-all",
  link: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200 px-0 p-1 underline transition-all",
  blue: "bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 transition-all",
  amber:
    "text-black bg-orange-500 dark:bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-600 transition-all",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", small, className = "", ...rest }, ref) => (
    <button
      className={classNames(
        "rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed",
        small ? "p-0.5 px-2" : "p-1 px-4",
        variant && buttonVariants[variant],
        className,
      )}
      {...rest}
      ref={ref}
    />
  ),
);
