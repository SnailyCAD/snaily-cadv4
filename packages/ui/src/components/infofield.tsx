import * as React from "react";
import { cn } from "mxcn";

type ParagraphProps = React.PropsWithoutRef<React.JSX.IntrinsicElements["p"]>;
interface Props extends ParagraphProps {
  label: string | React.ReactNode;
  childrenProps?: React.PropsWithoutRef<React.JSX.IntrinsicElements["span"]>;
}

export function Infofield({ childrenProps, label, ...props }: Props) {
  return (
    <div {...props}>
      <span className="font-semibold text-neutral-700 dark:text-gray-300/75">{label}: </span>
      <span {...childrenProps} className={cn("ml-0.5 dark:text-white", childrenProps?.className)}>
        {props.children}
      </span>
    </div>
  );
}
