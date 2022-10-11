import * as React from "react";
import { useDatePickerState, DatePickerStateOptions } from "@react-stately/datepicker";
import { useDatePicker } from "@react-aria/datepicker";
import { DateField } from "./DateField";
import { Calendar2, ExclamationCircle } from "react-bootstrap-icons";
import { Button } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { parseDate } from "@internationalized/date";
import formatISO9075 from "date-fns/formatISO9075";
import { ModalProvider } from "@react-aria/overlays";
import { Calendar } from "./Calendar/Calendar";
import { classNames } from "lib/classNames";
import dynamic from "next/dynamic";
import { useMounted } from "@casper124578/useful";

const Popover = dynamic(async () => (await import("./Popover")).Popover);

interface FieldProps {
  errorMessage: string;
  label: string;
  optional?: boolean;
  labelClassnames?: string;
  onChange: DatePickerStateOptions["onChange"];
  value?: Date;
}

export function DatePickerField({ value: _value, ...rest }: FieldProps) {
  const common = useTranslations("Common");
  const optionalText = common("optionalField");
  const isMounted = useMounted();

  const value = React.useMemo(() => {
    return parseDateOfBirth(_value);
  }, [_value]);

  const state = useDatePickerState({ ...rest, defaultValue: value });
  const ref = React.useRef<HTMLDivElement | null>(null);
  const {
    groupProps,
    labelProps,
    fieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
    errorMessageProps,
  } = useDatePicker({ ...rest }, state, ref);

  return (
    <ModalProvider>
      <div className="relative inline-flex flex-col text-left mb-3">
        <label {...labelProps} className={classNames("mb-1 dark:text-white", rest.labelClassnames)}>
          {rest.label}{" "}
          {rest.optional ? <span className="text-sm italic">({optionalText})</span> : null}
        </label>
        <div {...groupProps} ref={ref} className="flex group">
          <div className="relative bg-white dark:bg-secondary p-1.5 px-3 w-full rounded-l-md border border-r-0 border-gray-200 dark:border-quinary">
            {isMounted ? <DateField {...fieldProps} /> : null}
            {state.validationState === "invalid" && (
              <ExclamationCircle className="w-6 h-6 text-red-500 absolute right-1" />
            )}
          </div>
          <Button {...buttonProps} type="button" className="rounded-l-none">
            <Calendar2 className="w-5 h-5 fill-white" />
          </Button>
        </div>
        {state.isOpen && (
          <Popover {...dialogProps} isOpen={state.isOpen} onClose={() => state.setOpen(false)}>
            <Calendar {...calendarProps} />
          </Popover>
        )}

        {rest.errorMessage && (
          <span {...errorMessageProps} className="mt-1 font-medium text-red-500">
            {rest.errorMessage}
          </span>
        )}
      </div>
    </ModalProvider>
  );
}

export function parseDateOfBirth(value: Date | string | undefined) {
  if (!value) return undefined;
  const parsedDate = parseDate(formatISO9075(new Date(value), { representation: "date" }));

  return parsedDate;
}
