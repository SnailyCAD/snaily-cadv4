import { classNames } from "lib/classNames";

interface Props {
  label: string;
  children: React.ReactNode;
  fieldId?: string;
  className?: string;
  checkbox?: boolean;
}

export const FormField = ({ checkbox, children, label, className, fieldId }: Props) => {
  return (
    <fieldset
      className={classNames(
        "flex mb-3",
        checkbox ? "flex-row items-center" : "flex-col",
        className,
      )}
    >
      {!checkbox ? (
        <label className="mb-1 dark:text-white" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}

      {children}

      {checkbox ? (
        <label className="mb-1 dark:text-white" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
    </fieldset>
  );
};
