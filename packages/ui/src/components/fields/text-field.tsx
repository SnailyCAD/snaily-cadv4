import * as React from "react";
import { AriaTextFieldOptions, useTextField } from "@react-aria/textfield";
import { classNames } from "../../utils/classNames";
import { Input } from "../inputs/input";
import { Textarea } from "../inputs/textarea";
import { ErrorMessage } from "../error-message";
import { Label } from "../label";

interface Props extends AriaTextFieldOptions<"input"> {
  label: React.ReactNode;
  isTextarea?: boolean;
  isOptional?: boolean;

  className?: string;
  labelClassnames?: string;
  errorMessage?: string | null;
  name?: string;
  children?: React.ReactNode;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function TextField(props: Props) {
  const _ref = React.useRef<any>(null);
  const ref = props.inputRef ?? _ref;

  const { labelProps, inputProps, errorMessageProps } = useTextField(
    { ...props, inputElementType: props.isTextarea ? "textarea" : "input" },
    ref,
  );

  return (
    <div className={classNames("text-field flex flex-col mb-3", props.className)}>
      <Label element="span" {...props} labelProps={labelProps} />

      {props.isTextarea ? (
        <Textarea ref={ref} errorMessage={props.errorMessage} {...(inputProps as any)} />
      ) : (
        <Input ref={ref} errorMessage={props.errorMessage} {...(inputProps as any)} />
      )}
      {props.children}

      {props.errorMessage && (
        <ErrorMessage errorMessage={props.errorMessage} errorMessageProps={errorMessageProps} />
      )}
    </div>
  );
}
