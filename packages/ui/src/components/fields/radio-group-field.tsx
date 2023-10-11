import * as React from "react";
import {
  useRadioGroup,
  useRadio,
  type AriaRadioProps,
  type AriaRadioGroupProps,
} from "@react-aria/radio";
import { useRadioGroupState } from "@react-stately/radio";
import { RadioContext, useRadioFieldContext } from "../../context/radio-field-context";
import { ErrorMessage } from "../error-message";
import { Label } from "../label";
import { cn } from "mxcn";

interface Props extends AriaRadioGroupProps {
  children: React.ReactNode;
  label: string;
  isDisabled?: boolean;
  isOptional?: boolean;
  errorMessage?: React.ReactNode;
}

export function RadioGroupField(props: Props) {
  const state = useRadioGroupState({ ...props });
  const { radioGroupProps, labelProps, errorMessageProps } = useRadioGroup(props, state);

  return (
    <div {...radioGroupProps}>
      <Label {...props} labelProps={labelProps} />

      <div className="mt-0.5">
        <RadioContext.Provider value={state}>{props.children}</RadioContext.Provider>
      </div>

      {props.errorMessage ? (
        <ErrorMessage errorMessage={props.errorMessage} errorMessageProps={errorMessageProps} />
      ) : null}
    </div>
  );
}

export function Radio(props: AriaRadioProps) {
  const state = useRadioFieldContext();
  const ref = React.useRef(null);
  const { inputProps, isDisabled } = useRadio(props, state, ref);

  return (
    <label className="block dark:text-gray-200 my-0.5">
      <input {...inputProps} ref={ref} />
      <span className={cn("ml-1", isDisabled && "opacity-80 cursor-not-allowed")}>
        {props.children}
      </span>
    </label>
  );
}
