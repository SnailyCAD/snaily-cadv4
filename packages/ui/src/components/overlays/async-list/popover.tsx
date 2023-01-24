import * as React from "react";
import { FocusScope } from "@react-aria/focus";
import { useOverlay, DismissButton } from "@react-aria/overlays";
import { classNames } from "../../../utils/classNames";

interface Props {
  children: React.ReactNode;
  onClose(): void;
  isOpen: boolean;
  popoverRef?: any;
  menuClassName?: string;
}

export function Popover(props: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { popoverRef = ref, isOpen, onClose, children, menuClassName } = props;

  const { overlayProps } = useOverlay({ isOpen, onClose, isDismissable: true }, popoverRef);

  return (
    <FocusScope contain>
      <div
        {...overlayProps}
        ref={popoverRef}
        className={classNames(
          "w-full absolute z-50 top-full bg-gray-200 dark:bg-primary dark:border dark:border-secondary rounded-md shadow-lg mt-2 p-2",
          menuClassName,
        )}
      >
        {children}
        <DismissButton onDismiss={onClose} />
      </div>
    </FocusScope>
  );
}
