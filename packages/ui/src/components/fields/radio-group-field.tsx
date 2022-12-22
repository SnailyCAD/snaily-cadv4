import * as React from "react";
import { useRadioGroup, useRadio, AriaRadioProps, AriaRadioGroupProps } from "@react-aria/radio";
import { useRadioGroupState } from "@react-stately/radio";
import { RadioContext, useRadioFieldContext } from "../../context/radio-field-context";
import { ErrorMessage } from "../error-message";
import { Label } from "../label";

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
  const { inputProps } = useRadio(props, state, ref);

  return (
    <label className="block">
      <input {...inputProps} ref={ref} />
      <span className="ml-1">{props.children}</span>
    </label>
  );
}
