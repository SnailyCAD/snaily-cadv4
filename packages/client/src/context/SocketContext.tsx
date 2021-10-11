import * as React from "react";
import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";

interface Context {
  socket: Socket;
}

const SocketContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  url: string;
  options: Partial<SocketOptions & ManagerOptions>;
}

export const SocketProvider = ({ url, options, children }: ProviderProps) => {
  const [socket] = React.useState(io(url, options));

  const value = { socket };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export function useSocket() {
  const context = React.useContext(SocketContext);
  if (typeof context === "undefined") {
    throw new Error("`useSocket` must be used within a `SocketProvider`");
  }

  return context;
}

// https://github.com/scripters-dev/use-socket.io/blob/master/src/useListener.tsx
export function useListener(eventName: string, callback: (data: any) => void) {
  const { socket } = useSocket();
  const callbackRef = React.useRef(callback);

  const subscribeToEvent = React.useCallback(() => {
    if (socket && !socket.hasListeners(eventName)) {
      socket.on(eventName, callbackRef.current);
    }
  }, [socket, eventName]);

  const unsubscribeFromEvent = React.useCallback(() => {
    if (socket && socket.hasListeners(eventName)) {
      socket.off(eventName, callbackRef.current);
    }
  }, [socket, eventName]);

  React.useEffect(() => {
    subscribeToEvent();

    return () => {
      unsubscribeFromEvent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
