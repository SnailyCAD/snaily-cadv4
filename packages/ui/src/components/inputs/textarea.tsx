import * as React from "react";
import { classNames } from "../../utils/classNames";

type Props = Omit<JSX.IntrinsicElements["textarea"], "id"> & {
  errorMessage?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ errorMessage, ...rest }, ref) => (
    <textarea
      ref={ref}
      {...rest}
      className={classNames(
        `
      w-full p-1.5 px-3 bg-white rounded-md border
      outline-none focus:border-gray-800 dark:focus:border-gray-500
      dark:bg-secondary dark:text-white
      disabled:cursor-not-allowed disabled:opacity-80
      placeholder:opacity-50 resize-y min-h-[3em]
      transition-colors`,
        errorMessage
          ? "border-red-500 focus:border-red-700 dark:focus:border-red-700"
          : "border-gray-200 dark:border-gray-700",
        rest.className,
      )}
    />
  ),
);
