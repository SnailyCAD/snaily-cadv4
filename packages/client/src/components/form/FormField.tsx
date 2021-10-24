import { classNames } from "lib/classNames";

interface Props {
  label: string;
  children: React.ReactNode;
  fieldId?: string;
  className?: string;
}

export const FormField = ({ children, label, className, fieldId }: Props) => {
  return (
    <fieldset className={classNames("flex flex-col mb-3", className)}>
      <label className="mb-1 dark:text-white" htmlFor={fieldId}>
        {label}
      </label>

      {children}
    </fieldset>
  );
};
