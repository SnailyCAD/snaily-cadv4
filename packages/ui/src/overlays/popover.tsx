import * as React from "react";
import { FocusScope } from "@react-aria/focus";
import { AriaDialogProps, useDialog } from "@react-aria/dialog";
import {
  OverlayContainer,
  useOverlayPosition,
  useOverlay,
  useModal,
  DismissButton,
} from "@react-aria/overlays";
import { mergeProps } from "@react-aria/utils";

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

  const { overlayProps: positionProps, updatePosition } = useOverlayPosition({
    isOpen,
    offset: 2,
    containerPadding: 0,
    overlayRef: ref,
    targetRef: outerRef,
    placement: "bottom start",
  });

  React.useLayoutEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  }, [isOpen, updatePosition]);

  const style = {
    ...positionProps.style,
    "--select-width": outerRef.current ? `${outerRef.current.offsetWidth}px` : undefined,
  };

  return (
    <div ref={outerRef}>
      <OverlayContainer>
        <FocusScope restoreFocus contain>
          <div
            {...mergeProps(overlayProps, modalProps, dialogProps)}
            ref={popoverRef}
            className="w-full absolute top-full bg-gray-200 dark:bg-primary dark:border dark:border-secondary rounded-md shadow-lg mt-2 p-2 z-10"
            style={{
              zIndex: 999,
              width: outerRef.current?.clientWidth,
              ...style,
            }}
          >
            {children}
            <DismissButton onDismiss={onClose} />
          </div>
        </FocusScope>
      </OverlayContainer>
    </div>
  );
}
