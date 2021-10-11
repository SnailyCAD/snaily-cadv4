import { classNames } from "lib/classNames";
import * as React from "react";

type Props = JSX.IntrinsicElements["textarea"] & {
  hasError?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ hasError, ...rest }, ref) => (
    <textarea
      ref={ref}
      {...rest}
      className={classNames(
        `
      w-full p-1.5 px-3 bg-white rounded-md border-[1.5px] border-gray-200
      outline-none focus:border-gray-800
      hover:border-dark-gray
      disabled:cursor-not-allowed disabled:opacity-80
      resize-y min-h-[3em]
      transition-colors`,
        hasError && "border-red-500",
        rest.className,
      )}
    />
  ),
);
