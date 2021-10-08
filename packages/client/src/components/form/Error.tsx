import type * as React from "react";

interface Props {
  children: React.ReactNode;
}

export const Error = ({ children }: Props) => {
  if (!children) return null;

  return <span className="text-red-500 mt-1">{children}</span>;
};
