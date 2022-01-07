import type * as React from "react";

type ParagraphProps = JSX.IntrinsicElements["p"];
interface Props extends ParagraphProps {
  label: string | React.ReactNode;
}

export function Infofield(props: Props) {
  return (
    <p {...props}>
      <span className="font-semibold text-gray-300/70">{props.label}: </span>
      <span className="ml-0.5">{props.children}</span>
    </p>
  );
}
