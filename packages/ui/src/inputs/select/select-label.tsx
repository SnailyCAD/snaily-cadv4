import { useTranslations } from "next-intl";
import type { SelectFieldProps, SelectValue } from "../../fields/select-field";
import { classNames } from "../../utils/classNames";

interface Props<T extends SelectValue> extends SelectFieldProps<T> {
  labelProps: any;
}

export function SelectLabel<T extends SelectValue>(props: Props<T>) {
  const common = useTranslations("Common");
  const optionalText = common("optionalField");

  return (
    <label
      {...props.labelProps}
      className={classNames(
        "mb-1 dark:text-white",
        props.hiddenLabel && "sr-only",
        props.labelClassnames,
      )}
    >
      {props.label}{" "}
      {props.isOptional ? <span className="text-sm italic">({optionalText})</span> : null}
    </label>
  );
}
