import * as React from "react";
import { useSocket } from "@casper124578/use-socket.io";
import type { Socket } from "socket.io-client";
import { useTranslations } from "next-intl";

export function useSocketError() {
  const [showError, setShowError] = React.useState(false);
  const socket = useSocket();

  React.useEffect(() => {
    if (!socket) return;

    const connectHandler = () => {
      setShowError(false);
      console.info("Reconnected to API socket.");
    };

    const disconnectHandler = (reason: Socket.DisconnectReason) => {
      console.info({ disconnectReason: reason });
      setShowError(true);
    };

    socket.on("disconnect", disconnectHandler);
    socket.on("connect", connectHandler);

    return () => {
      socket.off("disconnect", disconnectHandler);
      socket.off("connect", connectHandler);
    };
  }, [socket]);

  return { showError, SocketErrorComponent };
}

function SocketErrorComponent() {
  const t = useTranslations("Errors");

  return (
    <div role="alert" className="p-2 px-4 my-2 mb-5 text-black rounded-md shadow bg-red-400">
      <h1 className="text-xl font-bold">{t("socketError")}</h1>
      <p className="mt-1 text-lg">{t("socketErrorInfo")}</p>
    </div>
  );
}
