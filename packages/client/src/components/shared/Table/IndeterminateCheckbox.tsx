import { Checkbox } from "components/form/inputs/Checkbox";
import * as React from "react";

type Props = JSX.IntrinsicElements["input"] & {
  indeterminate?: boolean;
  ref?: React.RefObject<HTMLInputElement>;
};

export function IndeterminateCheckbox({ indeterminate, ...props }: Props) {
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !props.checked && indeterminate;
    }
  }, [ref, indeterminate, props.checked]);

  return <Checkbox ref={ref} {...props} />;
}
