import * as React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "react-bootstrap-icons";

interface Props {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const Modal = ({ title, children, isOpen, onClose }: Props) => {
  return (
    <Transition
      show={isOpen}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
      as={React.Fragment}
    >
      <Dialog
        open={isOpen}
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Dialog.Overlay className="fixed inset-0 bg-black/10" />

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <div className="inline-block w-full max-w-md p-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            <Dialog.Title
              as="h3"
              className="text-xl font-semibold text-gray-900 flex items-center justify-between mb-2"
            >
              {title}

              <button
                onClick={onClose}
                className="p-1.5 transition-all cursor-pointer rounded-lg hover:bg-gray-200"
              >
                <X width={25} height={25} />
              </button>
            </Dialog.Title>

            {children}
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
