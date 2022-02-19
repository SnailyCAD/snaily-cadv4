import * as React from "react";
import { useField } from "@react-aria/label";
import { classNames } from "lib/classNames";
import { ExclamationSquareFill } from "react-bootstrap-icons";

type ReactNode = React.ReactChild | React.ReactFragment | React.ReactPortal;

interface Props {
  label: ReactNode;
  description: ReactNode;
  action: "input" | "checkbox";
  children: ReactNode;
  errorMessage?: string | null;
}

export function SettingsFormField({
  label,
  description,
  children,
  errorMessage,
  action = "input",
}: Props) {
  const { labelProps, fieldProps, errorMessageProps } = useField({ label, errorMessage });

  const [child] = Array.isArray(children) ? children : [children];

  const element = React.cloneElement(child, {
    ...fieldProps,
  });

  const borderColor = errorMessage ? "border-red-400" : "dark:border-gray-600";

  return (
    <div className={classNames("w-full card mb-3 border-[1px]", borderColor)}>
      <div className="flex justify-between p-4 py-0">
        <header className="py-4">
          <h3 className="text-xl font-semibold">
            <label {...labelProps}>{label}</label>
          </h3>

          <p className="mt-2 text-lg dark:text-gray-200">{description}</p>
        </header>

        <div
          className={classNames(
            "grid place-items-center border-l-[1px] py-4 px-2",
            action === "input" ? "w-1/3" : "w-40",
            borderColor,
          )}
        >
          {element}
        </div>
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
          <span className="dark:text-red-400 font-medium">Oh no! An error occurred.</span>
        </div>
      ) : null}
    </div>
  );
}
