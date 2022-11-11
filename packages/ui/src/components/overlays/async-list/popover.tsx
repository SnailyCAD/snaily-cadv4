import * as React from "react";
import { FocusScope } from "@react-aria/focus";
import { useOverlay, DismissButton } from "@react-aria/overlays";

interface Props {
  children: React.ReactNode;
  onClose(): void;
  isOpen: boolean;
  popoverRef?: any;
}

export function Popover(props: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { popoverRef = ref, isOpen, onClose, children } = props;

  const { overlayProps } = useOverlay({ isOpen, onClose, isDismissable: true }, popoverRef);

  return (
    <FocusScope contain>
      <div
        {...overlayProps}
        ref={popoverRef}
        className="w-full absolute top-full bg-gray-200 dark:bg-primary dark:border dark:border-secondary rounded-md shadow-lg mt-2 p-2 z-10"
      >
        {children}
        <DismissButton onDismiss={onClose} />
      </div>
    </FocusScope>
  );
}
