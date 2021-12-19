import type * as React from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * @deprecated use `errorMessage` on `FormField`
 */
export const Error = ({ children }: Props) => {
  if (!children) return null;

  return <span className="mt-1 text-red-500">{children}</span>;
};
