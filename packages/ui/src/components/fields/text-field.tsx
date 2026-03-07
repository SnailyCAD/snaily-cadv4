import * as React from "react";
import { type AriaTextFieldOptions, useTextField } from "@react-aria/textfield";
import { cn } from "mxcn";
import { Input } from "../inputs/input";
import { Textarea } from "../inputs/textarea";
import { ErrorMessage } from "../error-message";
import { Label } from "../label";
import { PasswordInputButton } from "../inputs/password-input-button";

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
  const _ref = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const ref = props.inputRef ?? _ref;

  const { labelProps, inputProps, errorMessageProps } = useTextField(
    { ...props, inputElementType: props.isTextarea ? "textarea" : "input" } as AriaTextFieldOptions<
      "input" | "textarea"
    >,
    ref as unknown as Parameters<typeof useTextField>[1],
  );

  return (
    <div className={cn("relative text-field flex flex-col mb-3", props.className)}>
      <Label {...props} labelProps={labelProps} />

      {props.isTextarea ? (
        <Textarea
          errorMessage={props.errorMessage}
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          {...(inputProps as React.ComponentProps<"textarea">)}
        />
      ) : (
        <Input
          errorMessage={props.errorMessage}
          ref={ref as React.RefObject<HTMLInputElement>}
          {...(inputProps as React.ComponentProps<"input">)}
        />
      )}
      {props.children}

      {props.type === "password" && !props.isTextarea ? (
        <PasswordInputButton inputRef={ref as React.RefObject<HTMLInputElement>} />
      ) : null}

      {props.errorMessage && (
        <ErrorMessage errorMessage={props.errorMessage} errorMessageProps={errorMessageProps} />
      )}
    </div>
  );
}
