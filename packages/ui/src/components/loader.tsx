import { useProgressBar } from "@react-aria/progress";
import { classNames } from "../utils/classNames";

interface Props {
  className?: string;
}

export function Loader(props: Props) {
  const { progressBarProps } = useProgressBar({ label: "loading..." });

  return (
    <div
      {...progressBarProps}
      style={{ borderTopColor: "transparent" }}
      className={classNames(
        "w-5 h-5 border-2 border-gray-800 dark:border-gray-400  border-solid rounded-full animate-spin",
        props.className,
      )}
    />
  );
}
