import * as React from "react";
import { ExclamationCircleFill } from "react-bootstrap-icons";
import { type VariantProps, cva } from "class-variance-authority";

type AlertVariantsProps = VariantProps<typeof alertVariants>;

interface AlertProps extends AlertVariantsProps {
  title?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const alertVariants = cva("flex flex-col p-2 px-4 text-black rounded-md shadow border", {
  variants: {
    type: {
      warning: "bg-orange-400 border-orange-500/80",
      error: "bg-red-400 border-red-500/80",
      success: "bg-green-400 border-green-500/80",
      info: "bg-slate-900 border-slate-500 text-white",
    },
  },
});

export function Alert(props: AlertProps) {
  return (
    <div
      role="alert"
      className={alertVariants({
        className: props.className,
        type: props.type,
      })}
    >
      {props.title ? (
        <header className="flex items-center gap-2 mb-2">
          {props.icon ?? <ExclamationCircleFill />}
          <h5 className="font-semibold text-lg">{props.title}</h5>
        </header>
      ) : null}
      {props.message ? (
        <div className="flex items-center gap-2">
          {!props.title ? (props.icon ?? <ExclamationCircleFill />) : null}
          <p>{props.message}</p>
        </div>
      ) : null}

      {props.children}
    </div>
  );
}
