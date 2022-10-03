import * as React from "react";
import { FocusScope } from "@react-aria/focus";
import { AriaDialogProps, useDialog } from "@react-aria/dialog";
import { useOverlay, useModal, DismissButton } from "@react-aria/overlays";
import { mergeProps } from "@react-aria/utils";

interface Props extends AriaDialogProps {
  children: React.ReactNode;
  onClose(): void;
  isOpen: boolean;
  popoverRef?: any;
}

export function Popover(props: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { popoverRef = ref, isOpen, onClose, children, ...otherProps } = props;

  const { overlayProps } = useOverlay(
    {
      isOpen,
      onClose,
      isDismissable: true,
    },
    popoverRef,
  );

  const { modalProps } = useModal();
  const { dialogProps } = useDialog(otherProps, popoverRef);

  return (
    <FocusScope contain restoreFocus>
      <div
        {...mergeProps(overlayProps, modalProps, dialogProps)}
        ref={popoverRef}
        className="absolute top-full bg-gray-200 dark:bg-primary dark:border dark:border-secondary rounded-md shadow-lg mt-2 p-8 z-10"
      >
        {children}
        <DismissButton onDismiss={onClose} />
      </div>
    </FocusScope>
  );
}
