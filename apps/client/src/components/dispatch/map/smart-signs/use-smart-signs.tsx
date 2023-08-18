import * as React from "react";
import { toastMessage } from "lib/toastMessage";
import { useDispatchMapState, useSocketStore } from "state/mapState";
import { ConnectionStatus } from "@snailycad/ui";

export function useSmartSigns() {
  const { setSmartSigns, smartSigns } = useDispatchMapState((state) => ({
    smartSigns: state.smartSigns,
    setSmartSigns: state.setSmartSigns,
  }));

  const { currentMapServerURL } = useDispatchMapState();
  const { socket, setStatus, setSocket } = useSocketStore();

  const onInitialize = React.useCallback((data: unknown) => {
    console.log(data);
  }, []);

  const onError = React.useCallback(
    (reason: Error) => {
      console.log({ reason });
      setStatus(ConnectionStatus.DISCONNECTED);

      toastMessage({
        message: (
          <>
            Unable to make a Websocket connection to {currentMapServerURL}.{" "}
            <a
              target="_blank"
              rel="noreferrer"
              className="underline text-blue-200"
              href="https://docs.snailycad.org/docs/fivem-integrations/live-map#connecting-to-snailycadv4"
            >
              See documentation.
            </a>
          </>
        ),
        title: "Connection Error",
        duration: 10_000,
      });
    },
    [currentMapServerURL], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onConnect = React.useCallback(() => {
    setStatus(ConnectionStatus.CONNECTED);
    toastMessage({
      icon: "success",
      message: "Successfully connected to the server",
      title: "Connection Success",
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const s = socket;

    if (s) {
      s.on("sna-live-map:smart-signs", onInitialize);
      s.on("disconnect", console.log);
      s.once("connect_error", onError);
      s.on("connect", onConnect);
    }

    return () => {
      s?.off("sna-live-map:smart-signs", onInitialize);
      s?.off("disconnect", console.log);
      s?.off("connect_error", onError);
      s?.off("connect", onConnect);
    };
  }, [socket, onError, onInitialize, onConnect]);

  return {
    smartSigns,
  };
}
