import { classNames } from "lib/classNames";

type Props = JSX.IntrinsicElements["fieldset"] & {
  label: string | null;
  fieldId?: string;
  checkbox?: boolean;
};

export const FormField = ({ checkbox, children, label, className, fieldId, ...rest }: Props) => {
  return (
    <fieldset
      {...rest}
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
