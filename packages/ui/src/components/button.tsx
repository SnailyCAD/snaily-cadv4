import * as React from "react";
import { AriaButtonProps, useButton } from "@react-aria/button";
import { mergeProps } from "@react-aria/utils";
import { twMerge } from "tailwind-merge";

type BaseButtonProps = Omit<JSX.IntrinsicElements["button"], "onPress"> & AriaButtonProps;
export type ButtonProps = BaseButtonProps & {
  size?: keyof typeof buttonSizes;
  variant?: keyof typeof buttonVariants | null;
};

export const buttonVariants = {
  default:
    "bg-gray-300 hover:bg-gray-400 text-black dark:hover:brightness-150 dark:bg-secondary dark:text-white border border-gray-400 dark:border-quinary",
  cancel: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200",
  danger: "bg-red-500 hover:bg-red-600 border border-red-800 text-black",
  success: "bg-emerald-500 hover:bg-emerald-600 border border-emerald-800 text-black",
  transparent: "bg-transparent text-black dark:text-white",
  link: "bg-transparent hover:bg-transparent text-gray-800 dark:text-gray-200 px-0 p-1 underline",
  blue: "bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 dark:border dark:border-blue-800 text-black",
  amber:
    "text-black bg-orange-500 dark:bg-orange-500 border border-amber-800 hover:bg-orange-600 dark:hover:bg-orange-600",
};

export const buttonSizes = {
  xs: "p-0.5 px-2",
  sm: "p-1 px-4",
  md: "p-1.5 px-4",
  lg: "p-2 px-6",
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "sm",
      className = "",
      isDisabled,
      onPress,
      onPressChange,
      onPressStart,
      onPressEnd,
      onPressUp,
      excludeFromTabOrder,
      ...rest
    },
    ref,
  ) => {
    const { buttonProps } = useButton(
      {
        onPress,
        onPressChange,
        onPressStart,
        onPressEnd,
        onPressUp,
        isDisabled,
        excludeFromTabOrder,
        ...rest,
      },
      ref as React.RefObject<HTMLButtonElement>,
    );

    return (
      <button
        className={twMerge(
          "rounded-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors",
          buttonSizes[size],
          variant && buttonVariants[variant],
          className,
        )}
        {...mergeProps(rest, buttonProps)}
        ref={ref}
      />
    );
  },
);
