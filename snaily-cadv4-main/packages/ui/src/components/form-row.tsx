import * as React from "react";
import { cn } from "mxcn";

type Props = React.PropsWithoutRef<React.JSX.IntrinsicElements["div"]> & {
  children: React.ReactNode;
  /** use flexbox instead of grid (Allows for children to be variable length) */
  useFlex?: boolean;
};

export function FormRow({ useFlex = false, children, className, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={cn(
        "w-full gap-2",
        useFlex ? "flex flex-col sm:flex-row" : "grid grid-cols-1 sm:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
