import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { classNames } from "lib/classNames";

type ButtonProps = JSX.IntrinsicElements["button"];

interface Props extends ButtonProps {
  toggled: boolean;
  name: string;
  onClick: (value: any) => void;
}

export const Toggle = React.forwardRef<HTMLButtonElement, Props>(
  ({ toggled, onClick, name, ...props }, ref) => {
    return (
      <SwitchPrimitive.Root
        onCheckedChange={() => onClick({ target: { name, value: !toggled } })}
        id={name}
        {...props}
        ref={ref}
        name={name}
        checked={toggled}
        className="relative h-6 transition-all rounded-full shadow-sm min-w-[44px] w-11 bg-gray-400/50 dark:bg-gray-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SwitchPrimitive.Thumb
          className={classNames(
            "block w-4 h-4 transition-all rounded-full switch-component",
            toggled ? "bg-gray-4 dark:bg-[#e4e4e4]" : "bg-gray-600/40 dark:bg-gray-600",
          )}
        />
      </SwitchPrimitive.Root>
    );
  },
);
