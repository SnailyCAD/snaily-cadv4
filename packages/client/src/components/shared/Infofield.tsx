import { classNames } from "lib/classNames";
import type * as React from "react";

type ParagraphProps = JSX.IntrinsicElements["p"];
interface Props extends ParagraphProps {
  label: string | React.ReactNode;
  childrenProps?: JSX.IntrinsicElements["span"];
}

export function Infofield({ childrenProps, label, ...props }: Props) {
  return (
    <div {...props} className={classNames("text-lg", props.className)}>
      <span className="font-semibold text-neutral-700 dark:text-gray-300/75">{label}: </span>
      <span {...childrenProps} className={classNames("ml-0.5", childrenProps?.className)}>
        {props.children}
      </span>
    </div>
  );
}
