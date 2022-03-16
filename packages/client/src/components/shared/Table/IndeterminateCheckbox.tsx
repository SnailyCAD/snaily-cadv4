import * as React from "react";

type Props = JSX.IntrinsicElements["input"] & { indeterminate?: boolean };

export const IndeterminateCheckbox = React.forwardRef<HTMLInputElement, Props>(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = ref ?? defaultRef;

    React.useEffect(() => {
      // @ts-expect-error ignore
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return <input className="cursor-pointer" type="checkbox" ref={resolvedRef} {...rest} />;
  },
);
