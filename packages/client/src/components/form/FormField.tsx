import * as React from "react";
import { useField } from "@react-aria/label";
import { classNames } from "lib/classNames";

interface Props {
  label: string;
  children: React.ReactNode;
  className?: string;
  checkbox?: boolean;
  boldLabel?: boolean;
  errorMessage?: string;
}

export const FormField = ({
  boldLabel,
  checkbox,
  children,
  label,
  className,
  errorMessage,
}: Props) => {
  const { labelProps, fieldProps, errorMessageProps } = useField({ label, errorMessage });

  const labelClassnames = classNames(
    "mb-1 dark:text-white",
    boldLabel && "font-semibold",
    checkbox && "ml-2",
  );

  const [child, ...rest] = Array.isArray(children) ? children : [children];

  const element = React.cloneElement(child as React.ReactElement<any>, fieldProps);

  return (
    <div
      className={classNames(
        "flex mb-3",
        checkbox ? "flex-row items-center" : "flex-col",
        className,
      )}
    >
      {!checkbox ? (
        <label {...labelProps} className={labelClassnames}>
          {label}
        </label>
      ) : null}

      {element}
      {rest}

      {checkbox ? (
        <label {...labelProps} className={labelClassnames}>
          {label}
        </label>
      ) : null}

      {errorMessage ? (
        <span {...errorMessageProps} className="mt-1 font-medium text-red-500">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
};
