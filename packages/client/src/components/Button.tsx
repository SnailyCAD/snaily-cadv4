import * as React from "react";
import { classNames } from "lib/classNames";

type Props = JSX.IntrinsicElements["button"] & {
  small?: boolean;
  variant?: keyof typeof variants;
};

const variants = {
  default: "bg-gray-500 hover:bg-gray-600 text-white",
  cancel: "bg-transparent hover:bg-transparent text-gray-800",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  success: "bg-green-500 hover:bg-green-500 text-white",
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = "default", small, className = "", ...rest }, ref) => (
    <button
      className={classNames(
        `${
          small ? "p-0.5 px-2" : "p-1 px-4"
        } rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed`,
        variant && variants[variant],
        className,
      )}
      {...rest}
      ref={ref}
    />
  ),
);
