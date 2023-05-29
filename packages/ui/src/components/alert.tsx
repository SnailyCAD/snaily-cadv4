import type * as React from "react";
import { ExclamationCircleFill } from "react-bootstrap-icons";
import { classNames } from "../utils/classNames";

interface AlertProps {
  type: keyof typeof variants;
  title?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const variants = {
  warning: "bg-orange-400 border-orange-500/80",
  error: "bg-red-400 border-red-500/80",
  success: "bg-green-400 border-green-500/80",
} as const;

export function Alert(props: AlertProps) {
  return (
    <div
      role="alert"
      className={classNames(
        "flex flex-col p-2 px-4 text-black rounded-md shadow border",
        variants[props.type],
        props.className,
      )}
    >
      {props.title ? (
        <header className="flex items-center gap-2 mb-2">
          <ExclamationCircleFill />
          <h5 className="font-semibold text-lg">{props.title}</h5>
        </header>
      ) : null}
      {props.message ? (
        <div className="flex items-center gap-2">
          {!props.title ? <ExclamationCircleFill /> : null}
          <p>{props.message}</p>
        </div>
      ) : null}

      {props.children}
    </div>
  );
}
