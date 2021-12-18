import { classNames } from "lib/classNames";

interface Props {
  label: string;
  children: React.ReactNode;
  fieldId?: string;
  className?: string;
  checkbox?: boolean;
  boldLabel?: boolean;
}

export const FormField = ({ boldLabel, checkbox, children, label, className, fieldId }: Props) => {
  const labelClassnames = ["mb-1 dark:text-white", boldLabel ? "font-semibold" : ""].join(" ");

  return (
    <fieldset
      className={classNames(
        "flex mb-3",
        checkbox ? "flex-row items-center" : "flex-col",
        className,
      )}
    >
      {!checkbox ? (
        <label className={labelClassnames} htmlFor={fieldId}>
          {label}
        </label>
      ) : null}

      {children}

      {checkbox ? (
        <label className={`${labelClassnames} ml-2`} htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
    </fieldset>
  );
};
