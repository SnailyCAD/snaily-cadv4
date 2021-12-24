import * as React from "react";
import { useField } from "@react-aria/label";
import { classNames } from "lib/classNames";
import useOnclickOutside from "react-cool-onclickoutside";
import { useTranslations } from "next-intl";

interface Props {
  label: string;
  children: React.ReactNode;
  className?: string;
  checkbox?: boolean;
  boldLabel?: boolean;
  errorMessage?: string;

  /** make a form field as optional */
  optional?: boolean;
}

export function FormField({
  boldLabel,
  checkbox,
  children,
  label,
  className,
  errorMessage,
  optional,
}: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = useOnclickOutside(() => setMenuOpen(false));
  const { labelProps, fieldProps, errorMessageProps } = useField({ label, errorMessage });
  const common = useTranslations("Common");
  const optionalText = common("optionalField");

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

  const isInput =
    ["__Input__", "__Textarea__"].includes(child.type?.displayName) ||
    child.type?.name === "Select";
  const inputProps = isInput ? { errorMessage } : {};

  const element = React.cloneElement(child as React.ReactElement<any>, {
    ...fieldProps,
    ...selectProps,
    ...inputProps,
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
          {label} {optional ? <span className="text-sm italic">({optionalText})</span> : null}
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
