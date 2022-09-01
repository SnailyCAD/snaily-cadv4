import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { classNames } from "lib/classNames";

type ButtonProps = JSX.IntrinsicElements["button"];

interface Props extends Omit<ButtonProps, "value"> {
  name: string;
  value: boolean;
  onCheckedChange(value: any): void;
}

export const Toggle = React.forwardRef<HTMLButtonElement, Props>(
  ({ value, onCheckedChange, name, ...props }, ref) => {
    return (
      <SwitchPrimitive.Root
        onCheckedChange={() => onCheckedChange({ target: { name, value: !value } })}
        id={name}
        {...props}
        ref={ref}
        name={name}
        checked={value}
        className={classNames(
          "relative h-6 transition-all rounded-full shadow-sm min-w-[44px] w-11 disabled:opacity-50 disabled:cursor-not-allowed",
          value ? "bg-blue-400" : "bg-gray-200 dark:bg-secondary",
        )}
      >
        <SwitchPrimitive.Thumb
          data-state={value ? "checked" : "unchecked"}
          className={classNames(
            "block w-4 h-4 transition-all rounded-full switch-component",
            "bg-white dark:bg-gray-200",
          )}
        />
      </SwitchPrimitive.Root>
    );
  },
);
