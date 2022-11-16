import { InfoCircleFill, X } from "react-bootstrap-icons";
import toast, { type ToastOptions, ErrorIcon, CheckmarkIcon } from "react-hot-toast";

interface Options extends ToastOptions {
  message: string | React.ReactNode;
  title?: string;
  icon?: "success" | "error" | "info" | null;
}

export function toastMessage(options: Options) {
  const { title, message, icon, ...rest } = options;
  const Icon =
    icon !== null ? (
      icon === "success" ? (
        <CheckmarkIcon />
      ) : icon === "info" ? (
        <InfoCircleFill className="fill-current text-blue-500 drop-shadow-sm w-5 h-5" />
      ) : (
        <ErrorIcon />
      )
    ) : null;

  return toast.custom((t) => {
    return (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white dark:bg-quinary shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">{Icon}</div>
            <div className="ml-3 flex-1 -mt-1">
              {title ? (
                <p className="capitalize text-[1.05em] mb-1 font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </p>
              ) : null}
              <div className="text-lg text-neutral-500 dark:text-gray-300">{message}</div>
            </div>
          </div>
        </div>
        <div className="flex items-start justify-start h-full">
          <button
            type="button"
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
  }, rest);
}
