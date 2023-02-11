import * as React from "react";
import { useSocket } from "@casper124578/use-socket.io";
import type { Socket } from "socket.io-client";

const DISCONNECT_REASONS = ["transport close", "transport error"];

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
      if (DISCONNECT_REASONS.includes(reason)) {
        console.info({ disconnectReason: reason });
        setShowError(true);
      }
    };

    socket.on("disconnect", disconnectHandler);
    socket.on("connect", connectHandler);

    return () => {
      socket.off("disconnect", disconnectHandler);
      socket.off("connect", connectHandler);
    };
  }, [socket]);

  return { showError };
}
