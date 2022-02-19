import * as React from "react";
import { useField } from "@react-aria/label";
import { classNames } from "lib/classNames";
import { ExclamationSquareFill } from "react-bootstrap-icons";

type ReactNode = React.ReactChild | React.ReactFragment | React.ReactPortal;

const rightAreaStyles = {
  input: "border-t-[1px] w-full px-4",
  "short-input": "grid place-items-center border-l-[1px] w-60 min-w-[16rem] px-2.5",
  checkbox: "grid place-items-center border-l-[1px] w-40 min-w-[10rem]",
};

interface Props {
  label: ReactNode;
  description: React.ReactNode;
  action?: "input" | "checkbox" | "short-input";
  children: ReactNode;
  errorMessage?: string | null;
  optional?: boolean;
}

export function SettingsFormField({
  label,
  description,
  children,
  errorMessage,
  action = "input",
  optional,
}: Props) {
  const { labelProps, fieldProps, errorMessageProps } = useField({ label, errorMessage });

  const [child] = Array.isArray(children) ? children : [children];

  const isInput =
    ["__Input__", "__Textarea__"].includes(child?.type?.displayName) ||
    child?.type?.name === "Select";
  const inputProps = isInput ? { errorMessage } : {};

  const element = React.cloneElement(child, {
    ...fieldProps,
    ...inputProps,
  });

  const borderColor = errorMessage ? "border-red-400" : "dark:border-gray-600";

  return (
    <div className={classNames("w-full card mb-5 border-[1px]", borderColor)}>
      <div
        className={classNames(
          "py-0 gap-2",
          ["checkbox", "short-input"].includes(action) ? "flex justify-between" : "flex flex-col",
        )}
      >
        <header className="py-4 px-4">
          <h3 className="text-[1.275rem] font-semibold">
            <label {...labelProps}>
              {label}

              {optional ? (
                <span className="text-sm font-normal italic ml-1">{"(Optional)"}</span>
              ) : null}
            </label>
          </h3>

          {description ? (
            <p className="mt-2 text-lg dark:text-gray-200 max-w-2/3">{description}</p>
          ) : null}
        </header>

        <div className={classNames("py-4", rightAreaStyles[action], borderColor)}>{element}</div>
      </div>

      {errorMessage ? (
        <div
          {...errorMessageProps}
          className={classNames("px-4 p-1.5 border-t-[1px] flex items-center gap-2", borderColor)}
        >
          <ExclamationSquareFill
            width={16}
            height={16}
            className="fill-current dark:text-red-400"
          />
          <span className="dark:text-red-400 font-medium">{errorMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
