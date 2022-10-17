import * as React from "react";
import { useField } from "@react-aria/label";
import { classNames } from "lib/classNames";
import useonPressOutside from "react-cool-onclickoutside";
import { useTranslations } from "next-intl";

interface Props {
  label: string | null;
  children: React.ReactNode;
  className?: string;
  checkbox?: boolean;
  errorMessage?: any;

  hideLabel?: boolean;
  boldLabel?: boolean;
  labelClassName?: string;

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
  hideLabel,
  labelClassName,
}: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = useonPressOutside(() => setMenuOpen(false));
  const { labelProps, fieldProps, errorMessageProps } = useField({ label, errorMessage });
  const common = useTranslations("Common");
  const optionalText = common("optionalField");

  const labelClassnames = classNames(
    "mb-1 dark:text-white",
    boldLabel && "font-semibold",
    checkbox && "ml-2 w-full",
    hideLabel && "hidden",
    labelClassName,
  );

  const [child, ...rest] = Array.isArray(children) ? children : [children];

  // these are used to auto-focus when the user clicks on the label (how htmlFor=".." and id="..." work)
  const selectProps =
    child?.type?.name === "Select"
      ? {
          menuIsOpen: menuOpen,
          onMenuClose: () => setMenuOpen(false),
          onMenuOpen: () => setMenuOpen(true),
          onBlur: () => setMenuOpen(false),
        }
      : {};

  const checkboxProps = checkbox ? { className: "max-w-[20px]" } : {};

  const isInput =
    ["__Input__", "__Textarea__"].includes(child?.type?.displayName) ||
    child?.type?.name === "Select";
  const inputProps = isInput ? { errorMessage } : {};

  const element = React.cloneElement(child as React.ReactElement, {
    ...fieldProps,
    ...selectProps,
    ...inputProps,
    ...checkboxProps,
  });

  function handleLabelClick() {
    if (!child.props.disabled) {
      setMenuOpen((v) => !v);
    }
  }

  return (
    <div ref={ref} className={classNames("flex flex-col mb-3", className)}>
      <div
        className={classNames("flex", checkbox ? "flex-row items-center" : "flex-col", className)}
      >
        {!checkbox ? (
          <label onClick={handleLabelClick} {...labelProps} className={labelClassnames}>
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
      </div>

      {errorMessage ? (
        <span {...errorMessageProps} className="mt-1 font-medium text-red-500">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
