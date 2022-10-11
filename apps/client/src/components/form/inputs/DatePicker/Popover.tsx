import * as React from "react";
import { FocusScope } from "@react-aria/focus";
import { AriaDialogProps, useDialog } from "@react-aria/dialog";
import { useOverlay, useModal, DismissButton } from "@react-aria/overlays";
import { mergeProps } from "@react-aria/utils";
import { createPortal } from "react-dom";

interface Props extends AriaDialogProps {
  children: React.ReactNode;
  onClose(): void;
  isOpen: boolean;
  popoverRef?: any;
}

export function Popover(props: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const outerRef = React.useRef<HTMLDivElement>(null);
  const { popoverRef = ref, isOpen, onClose, children, ...otherProps } = props;

  const { overlayProps } = useOverlay({ isOpen, onClose, isDismissable: true }, popoverRef);
  const { modalProps } = useModal();
  const { dialogProps } = useDialog(otherProps, popoverRef);
  const pos = outerRef.current?.getBoundingClientRect();

  return (
    <div ref={outerRef}>
      {createPortal(
        <FocusScope contain>
          <div
            {...mergeProps(overlayProps, modalProps, dialogProps)}
            ref={popoverRef}
            className="w-full absolute  bg-gray-200 dark:bg-primary dark:border dark:border-secondary rounded-md shadow-lg mt-2 p-2 z-50"
            style={{
              left: pos?.left,
              top: pos?.top,
              width: pos?.width,
            }}
          >
            {children}
            <DismissButton onDismiss={onClose} />
          </div>
        </FocusScope>,
        document.body,
      )}
    </div>
  );
}
