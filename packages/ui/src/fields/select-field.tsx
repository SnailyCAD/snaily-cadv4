import * as React from "react";
import { HiddenSelect, useSelect } from "@react-aria/select";
import { useSelectState } from "@react-stately/select";
import { useTranslations } from "next-intl";
import { classNames } from "../utils/classNames";
import { Popover } from "../overlays/Popover";

interface Props {
  isOptional?: boolean;

  label: string;
  className?: string;
  labelClassnames?: string;
  errorMessage?: string | null;
  name?: string;
  children: any;
}

export function Select(props: Props) {
  const optionalText = useTranslations("Common")("optional");

  const state = useSelectState(props);
  const ref = React.useRef<null>(null);
  const { labelProps, errorMessageProps, triggerProps, valueProps, menuProps } = useSelect(
    props,
    state,
    ref,
  );

  return (
    <div className={classNames("flex flex-col mb-3", props.className)}>
      <label {...labelProps} className={props.labelClassnames}>
        {props.label}{" "}
        {props.isOptional ? <span className="text-sm italic">({optionalText})</span> : null}
      </label>

      <HiddenSelect state={state} triggerRef={ref} label={props.label} name={props.name} />
      <Button {...triggerProps} buttonRef={ref} style={{ height: 30, fontSize: 14 }}>
        <span {...valueProps}>
          {state.selectedItem ? state.selectedItem.rendered : "Select an option"}
        </span>
        <span aria-hidden="true" style={{ paddingLeft: 5 }}>
          ▼
        </span>
      </Button>
      {state.isOpen && (
        <Popover isOpen={state.isOpen} onClose={state.close}>
          <ListBox {...menuProps} state={state} />
        </Popover>
      )}

      {props.errorMessage && (
        <span {...errorMessageProps} className="mt-1 font-medium text-red-500">
          {props.errorMessage}
        </span>
      )}
    </div>
  );
}
