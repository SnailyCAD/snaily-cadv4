import { classNames } from "lib/classNames";
import * as React from "react";

type Props = JSX.IntrinsicElements["input"];

export const Checkbox = React.forwardRef<HTMLInputElement, Props>((props, ref) => (
  <input
    {...props}
    contentEditable={false}
    type="checkbox"
    className={classNames(
      "cursor-pointer rounded-md focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2",
      props.className,
    )}
    ref={ref}
  />
));
