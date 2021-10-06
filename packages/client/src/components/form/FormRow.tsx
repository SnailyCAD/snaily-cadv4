import type * as React from "react";

interface Props {
  children: React.ReactNode;
  justify?: boolean;
  flexLike?: boolean;
}

export const FormRow = ({ justify = true, flexLike = false, children }: Props) => {
  const cols = Array.isArray(children)
    ? `grid grid-cols-1 sm:grid-cols-${children.length}`
    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4";

  return (
    <div
      className={`mb-3 w-full ${flexLike ? "grid grid-cols-1 sm:flex" : cols} gap-2 ${
        justify && "justify-between"
      }`}
    >
      {children}
    </div>
  );
};
