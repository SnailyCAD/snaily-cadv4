import { X } from "react-bootstrap-icons";
import toast, { DefaultToastOptions, ErrorIcon } from "react-hot-toast";

interface MessageOptions {
  message: string;
  title?: string;
}

export function toastError(
  message: string | MessageOptions,
  options?: DefaultToastOptions["error"],
) {
  return toast.custom((t) => {
    const ms = typeof message === "string" ? message : message.message;
    const title = typeof message === "object" && message.title;

    return (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white dark:bg-dark-gray shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <ErrorIcon />
            </div>
            <div className="ml-3 flex-1">
              {title ? (
                <p className="capitalize text-[1.05em] mb-1 font-medium text-gray-900 dark:text-gray-100">
                  {title}
                </p>
              ) : null}
              <p className="text-lg text-neutral-500 dark:text-gray-300">{ms}</p>
            </div>
          </div>
        </div>
        <div className="flex items-start justify-start h-full">
          <button
            aria-label="Close message"
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium"
          >
            <X
              width={25}
              height={25}
              className="fill-current dark:text-gray-300 dark:hover:text-gray-100"
            />
          </button>
        </div>
      </div>
    );
  }, options);
}
