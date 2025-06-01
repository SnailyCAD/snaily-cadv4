import { useProgressBar } from "@react-aria/progress";
import { cn } from "mxcn";

interface Props {
  className?: string;
}

export function Loader(props: Props) {
  const { progressBarProps } = useProgressBar({ label: "loading..." });

  return (
    <div
      {...progressBarProps}
      style={{ borderTopColor: "transparent" }}
      className={cn(
        "w-5 h-5 border-2 border-gray-800 dark:border-gray-400  border-solid rounded-full animate-spin",
        props.className,
      )}
    />
  );
}
