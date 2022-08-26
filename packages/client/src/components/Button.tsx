import * as React from "react";
import { classNames } from "lib/classNames";

export type ButtonProps = JSX.IntrinsicElements["button"] & {
  size?: keyof typeof buttonSizes;
  variant?: keyof typeof buttonVariants | null;
};

export const buttonVariants = {
  default:
    "bg-gray-400 hover:bg-gray-500 text-black dark:hover:brightness-150 dark:bg-secondary dark:text-white dark:border dark:border-quinary transition-all",
  cancel: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200 transition-all",
  danger: "bg-red-500 hover:bg-red-600 dark:border dark:border-red-800 text-black transition-all",
  success:
    "bg-emerald-500 hover:bg-emerald-600 dark:border dark:border-emerald-800 text-black transition-all",
  transparent: "bg-transparent text-black dark:text-white transition-all",
  link: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200 px-0 p-1 underline transition-all",
  blue: "bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 dark:border dark:border-blue-800 transition-all text-black",
  amber:
    "text-black bg-orange-500 dark:bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-600 transition-all",
};

export const buttonSizes = {
  xs: "p-0.5 px-2",
  sm: "p-1 px-4",
  lg: "p-2 px-6",
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "sm", className = "", ...rest }, ref) => (
    <button
      className={classNames(
        "rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed",
        buttonSizes[size],
        variant && buttonVariants[variant],
        className,
      )}
      {...rest}
      ref={ref}
    />
  ),
);
