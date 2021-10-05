interface Props {
  label: string;
  children: React.ReactNode;
  fieldId?: string;
}

export const FormField = ({ children, label, fieldId }: Props) => {
  return (
    <fieldset className="flex flex-col mb-3">
      <label className="mb-2 dark:text-white" htmlFor={fieldId}>
        {label}
      </label>

      {children}
    </fieldset>
  );
};