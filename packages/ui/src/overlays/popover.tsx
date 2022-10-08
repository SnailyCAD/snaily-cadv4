import * as React from "react";
import { FocusScope } from "@react-aria/focus";
import { AriaDialogProps, useDialog } from "@react-aria/dialog";
import { useOverlay, useModal, DismissButton } from "@react-aria/overlays";
import { mergeProps, useViewportSize } from "@react-aria/utils";
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

  const [pos, setPos] = React.useState(() => outerRef.current?.getBoundingClientRect());
  const viewport = useViewportSize();

  const { overlayProps } = useOverlay({ isOpen, onClose, isDismissable: true }, popoverRef);
  const { modalProps } = useModal();
  const { dialogProps } = useDialog(otherProps, popoverRef);

  React.useEffect(() => {
    setPos(outerRef.current?.getBoundingClientRect());
  }, [viewport]);

  return (
    <div ref={outerRef}>
      {createPortal(
        <FocusScope contain restoreFocus>
          <div
            {...mergeProps(overlayProps, modalProps, dialogProps)}
            ref={popoverRef}
            className="w-full absolute top-full bg-gray-200 dark:bg-primary dark:border dark:border-secondary rounded-md shadow-lg mt-2 p-2 z-10"
            style={{
              zIndex: 999,
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
