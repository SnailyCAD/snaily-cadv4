import * as React from "react";
import {
  Root as DialogRoot,
  DialogPortal,
  DialogTitle,
  DialogClose,
  DialogContent,
  DialogOverlay,
} from "@radix-ui/react-dialog";
import { Transition } from "@headlessui/react";
import { X } from "react-bootstrap-icons";
import { useModal } from "state/modalState";
import { classNames } from "lib/classNames";

export interface ModalProps {
  modalStyles?: React.CSSProperties;
  title: string;
  children: React.ReactNode;
  dialogClassName?: string;
  isOpen: boolean;
  className?: string;
  isAlert?: boolean;
  onClose(): void;
}

export function Modal({
  modalStyles = {},
  title,
  children,
  isOpen,
  className,
  isAlert,
  dialogClassName,
  onClose,
}: ModalProps) {
  const { canBeClosed } = useModal();

  const handleClose = React.useCallback(() => {
    if (!canBeClosed) return;
    onClose();
  }, [canBeClosed, onClose]);

  return (
    <Transition show={isOpen} appear>
      <DialogRoot open={isOpen} onOpenChange={handleClose}>
        <DialogPortal>
          <DialogOverlay
            className={classNames(
              "overflow-y-auto fixed z-50 inset-0 bg-black/40 flex items-center justify-center w-full",
              dialogClassName,
            )}
          >
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-75"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-75"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogContent
                style={modalStyles}
                className={classNames(
                  "inline-block max-md:!w-full p-4 px-6 my-8 text-left align-middle transition-all transform bg-white border border-secondary dark:bg-tertiary dark:text-white shadow-xl rounded-lg",
                  isAlert ? "z-[998]" : "z-30",
                  className,
                )}
              >
                <DialogTitle className="flex items-center justify-between mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {title}

                  <DialogClose
                    type="button"
                    aria-label="Close Modal"
                    onClick={onClose}
                    className="p-1.5 transition-all cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-secondary"
                  >
                    <X width={25} height={25} />
                  </DialogClose>
                </DialogTitle>

                {children}
              </DialogContent>
            </Transition.Child>
          </DialogOverlay>
        </DialogPortal>
      </DialogRoot>
    </Transition>
  );
}
