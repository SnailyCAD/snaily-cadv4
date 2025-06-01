import * as React from "react";
import { cn } from "mxcn";

type Props = React.JSX.IntrinsicElements["input"];

export const Checkbox = React.forwardRef<HTMLInputElement, Props>((props, ref) => (
  <input
    {...props}
    contentEditable={false}
    type="checkbox"
    className={cn(
      "cursor-pointer rounded-md focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2",
      props.className,
    )}
    ref={ref}
  />
));
Checkbox.displayName = "Checkbox";
