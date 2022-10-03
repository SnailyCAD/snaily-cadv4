import * as React from "react";
import { useDatePickerState, DatePickerStateOptions } from "@react-stately/datepicker";
import { useDatePicker } from "@react-aria/datepicker";
import { DateField } from "./DateField";
// import { Calendar } from "./Calendar";
// import { Popover } from "./Popover";
import { Calendar2, ExclamationCircle } from "react-bootstrap-icons";
import { Button } from "components/Button";
import { useTranslations } from "next-intl";
import { parseDate } from "@internationalized/date";

interface FieldProps {
  label: string;
  optional?: boolean;
  labelClassnames?: string;
  onChange: DatePickerStateOptions["onChange"];
  value?: Date;
}

export function DatePickerField(props: FieldProps) {
  const common = useTranslations("Common");
  const optionalText = common("optionalField");
  const value = React.useMemo(
    () =>
      props.value
        ? parseDate(new Date(props.value.toString()).toISOString().slice(0, 10))
        : undefined,
    [props.value],
  );

  const state = useDatePickerState({ ...props, value });
  const ref = React.useRef<HTMLDivElement | null>(null);
  const { groupProps, labelProps, fieldProps, buttonProps, dialogProps, calendarProps } =
    useDatePicker({ ...props, value }, state, ref);

  return (
    <div className="relative inline-flex flex-col text-left">
      <label {...labelProps} className={props.labelClassnames}>
        {props.label}{" "}
        {props.optional ? <span className="text-sm italic">({optionalText})</span> : null}
      </label>

      <div {...groupProps} ref={ref} className="flex group">
        <div className="relative bg-white dark:bg-secondary p-1.5 px-3 w-full rounded-l-md border border-r-0 border-gray-200 dark:border-quinary">
          <DateField {...fieldProps} />
          {state.validationState === "invalid" && (
            <ExclamationCircle className="w-6 h-6 text-red-500 absolute right-1" />
          )}
        </div>
        <Button {...buttonProps} type="button" className="rounded-l-none">
          <Calendar2 className="w-5 h-5 fill-white" />
        </Button>
      </div>
      {/* {state.isOpen && (
        <Popover {...dialogProps} isOpen={state.isOpen} onClose={() => state.setOpen(false)}>
          <Calendar {...calendarProps} />
        </Popover>
      )} */}
    </div>
  );
}
