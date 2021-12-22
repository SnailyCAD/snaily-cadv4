import * as React from "react";
import { useField } from "@react-aria/label";
import { classNames } from "lib/classNames";
import useOnclickOutside from "react-cool-onclickoutside";

interface Props {
  label: string;
  children: React.ReactNode;
  className?: string;
  checkbox?: boolean;
  boldLabel?: boolean;
  errorMessage?: string;
}

export function FormField({
  boldLabel,
  checkbox,
  children,
  label,
  className,
  errorMessage,
}: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = useOnclickOutside(() => setMenuOpen(false));
  const { labelProps, fieldProps, errorMessageProps } = useField({ label, errorMessage });

  const labelClassnames = classNames(
    "mb-1 dark:text-white",
    boldLabel && "font-semibold",
    checkbox && "ml-2",
  );

  const [child, ...rest] = Array.isArray(children) ? children : [children];

  // these are used to auto-focus when the user clicks on the label (how htmlFor=".." and id="..." work)
  const selectProps =
    child.type?.name === "Select"
      ? {
          menuIsOpen: menuOpen,
          onMenuClose: () => setMenuOpen(false),
          onMenuOpen: () => setMenuOpen(true),
          onBlur: () => setMenuOpen(false),
        }
      : {};

  const element = React.cloneElement(child as React.ReactElement<any>, {
    ...fieldProps,
    ...selectProps,
  });

  return (
    <div
      ref={ref}
      className={classNames(
        "flex mb-3",
        checkbox ? "flex-row items-center" : "flex-col",
        className,
      )}
    >
      {!checkbox ? (
        <label onClick={() => setMenuOpen((v) => !v)} {...labelProps} className={labelClassnames}>
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
}
