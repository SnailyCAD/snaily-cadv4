import * as React from "react";
import { useDatePickerState } from "@react-stately/datepicker";
import { useDatePicker, AriaDateFieldProps } from "@react-aria/datepicker";
import { Calendar2, ExclamationCircle, X } from "react-bootstrap-icons";
import { Button } from "../button";
import { useTranslations } from "next-intl";
import { DateValue, parseDate } from "@internationalized/date";
import formatISO9075 from "date-fns/formatISO9075";
import { ModalProvider } from "@react-aria/overlays";
import { classNames } from "../../utils/classNames";
import dynamic from "next/dynamic";
import { useMounted } from "@casper124578/useful";
import { Popover } from "../overlays/popover";
import { DateField } from "../inputs/date-picker/date-field";
import { Loader } from "../loader";

const Calendar = dynamic(
  async () => (await import("../inputs/date-picker/calendar/calendar")).Calendar,
  {
    loading: () => <Loader />,
    ssr: false,
  },
);

interface Props extends AriaDateFieldProps<any> {
  label: string;
  isDisabled?: boolean;
  isOptional?: boolean;
  errorMessage?: React.ReactNode;
  labelClassnames?: string;
  onChange(value: DateValue | null): void;
  value?: Date;
  className?: string;
  isClearable?: boolean;
}

export function DatePickerField({ value: _value, ...rest }: Props) {
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
      <div
        className={classNames(
          "relative inline-flex flex-col text-left mb-3 w-full",
          rest.className,
        )}
      >
        <label {...labelProps} className={classNames("mb-1 dark:text-white", rest.labelClassnames)}>
          {rest.label}{" "}
          {rest.isOptional ? <span className="text-sm italic">({optionalText})</span> : null}
        </label>
        <div {...groupProps} ref={ref} className="flex group">
          <div
            className={classNames(
              "relative bg-white dark:bg-secondary p-1.5 px-3 w-full rounded-l-md border border-r-0",
              rest.isDisabled ? "cursor-not-allowed opacity-80" : "",
              rest.errorMessage
                ? "border-red-500 focus:border-red-700 dark:focus:border-red-700"
                : "border-gray-200 dark:border-quinary",
            )}
          >
            {isMounted ? <DateField errorMessage={rest.errorMessage} {...fieldProps} /> : null}
            {state.validationState === "invalid" && (
              <ExclamationCircle className="w-6 h-6 text-red-500 absolute right-1" />
            )}
          </div>
          <Button
            {...buttonProps}
            type="button"
            className={classNames(
              rest.isClearable ? "!rounded-none -mr-[1px]" : "rounded-l-none",
              rest.errorMessage &&
                "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
            )}
          >
            <Calendar2 className="w-5 h-5 fill-white" />
          </Button>
          {rest.isClearable ? (
            <Button
              size="xs"
              // @ts-expect-error null is allowed here to clear the date value
              onPress={() => state.setValue(null)}
              type="button"
              className={classNames(
                "rounded-l-none",

                rest.errorMessage &&
                  "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
              )}
            >
              <X className="w-5 h-5 fill-white" />
            </Button>
          ) : null}
        </div>
        {state.isOpen && (
          <Popover
            isCalendar
            className="right-0"
            {...dialogProps}
            isOpen={state.isOpen}
            onClose={() => state.setOpen(false)}
          >
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
