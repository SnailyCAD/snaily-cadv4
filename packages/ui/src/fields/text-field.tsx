import * as React from "react";
import { AriaTextFieldOptions, useTextField } from "@react-aria/textfield";
import { classNames } from "../utils/classNames";
import { useTranslations } from "next-intl";
import { Input } from "../inputs/input";
import { Textarea } from "../inputs/textarea";

interface Props extends AriaTextFieldOptions<"input"> {
  isTextarea?: boolean;
  isOptional?: boolean;

  className?: string;
  labelClassnames?: string;
  errorMessage?: string | null;
  name?: string;
  children?: React.ReactNode;
}

export function TextField(props: Props) {
  const ref = React.useRef<any>(null);
  const { labelProps, inputProps, errorMessageProps } = useTextField(
    { ...props, inputElementType: props.isTextarea ? "textarea" : "input" },
    ref,
  );

  const common = useTranslations("Common");
  const optionalText = common("optionalField");

  return (
    <div className={classNames("text-field flex flex-col mb-3", props.className)}>
      <label {...labelProps} className={classNames("mb-1", props.labelClassnames)}>
        {props.label}{" "}
        {props.isOptional ? <span className="text-sm italic">({optionalText})</span> : null}
      </label>

      {props.isTextarea ? (
        <Textarea ref={ref} {...(inputProps as any)} />
      ) : (
        <Input ref={ref} {...(inputProps as any)} />
      )}
      {props.children}

      {props.errorMessage && (
        <span {...errorMessageProps} className="mt-1 font-medium text-red-500">
          {props.errorMessage}
        </span>
      )}
    </div>
  );
}
