import { classNames } from "lib/classNames";
import type * as React from "react";

type Props = JSX.IntrinsicElements["div"] & {
  children: React.ReactNode;
  justify?: boolean;
  flexLike?: boolean;
};

export const FormRow = ({
  justify = true,
  flexLike = false,
  children,
  className = "",
  ...rest
}: Props) => {
  const cols = Array.isArray(children)
    ? `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${children.length}`
    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4";

  return (
    <div
      {...rest}
      className={classNames(
        "w-full gap-2",
        flexLike ? "grid grid-cols-1 sm:flex" : cols,
        justify && "justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};
