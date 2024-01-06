import * as React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fullscreen, FullscreenExit, X } from "react-bootstrap-icons";
import { useModal } from "state/modalState";
import { classNames } from "lib/classNames";
import { cn } from "mxcn";

export interface ModalProps {
  title: string;
  children: React.ReactNode;
  dialogClassName?: string;
  isOpen: boolean;
  className?: string;
  isAlert?: boolean;
  onClose(): void;
}

export function Modal({
  title,
  children,
  isOpen,
  className,
  isAlert,
  dialogClassName,
  onClose,
}: ModalProps) {
  const modalState = useModal();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleClose = React.useCallback(() => {
    if (!modalState.canBeClosed) return;
    onClose();
  }, [modalState, onClose]);

  return (
    <Transition show={isOpen} appear as={React.Fragment}>
      <Dialog
        open={isOpen}
        as="div"
        className={cn(
          "fixed inset-0 overflow-y-auto",
          isAlert ? "z-[999]" : "z-50",
          dialogClassName,
        )}
        onClose={handleClose}
      >
        <div className={classNames("min-h-screen text-center", !isFullscreen && "px-4")}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          {/* this element is to trick the browser into centering the modal contents. */}
          {isFullscreen ? null : (
            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>
          )}

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-75"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              style={
                isFullscreen
                  ? {
                      position: "fixed",
                      inset: 0,
                      margin: 0,
                      minWidth: "100vw",
                      borderRadius: 0,
                      width: "100vw",
                    }
                  : {}
              }
              className={cn(
                "max-w-[100%] inline-block text-left transition-all transform bg-white border border-secondary dark:bg-tertiary dark:text-white shadow-xl rounded-lg",
                isFullscreen ? "p-2" : "align-middle p-4 px-6 my-8",
                isAlert ? "z-[998]" : "z-30",
                className,
              )}
            >
              <Dialog.Title
                as="h3"
                className="flex items-center justify-between mb-2 text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {title}

                <div className="flex items-center gap-2">
                  {isAlert ? null : (
                    <button
                      type="button"
                      aria-label="Full Screen"
                      onClick={() => setIsFullscreen((v) => !v)}
                      className="p-1.5 transition-all cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-secondary"
                    >
                      {isFullscreen ? (
                        <FullscreenExit width={17} height={17} />
                      ) : (
                        <Fullscreen width={17} height={17} />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    aria-label="Close Modal"
                    onClick={onClose}
                    className="p-1.5 transition-all cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-secondary"
                  >
                    <X width={25} height={25} />
                  </button>
                </div>
              </Dialog.Title>

              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
