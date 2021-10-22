import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import * as React from "react";
import { FullDeputy } from "state/dispatchState";

export function useActiveDeputies(initDeputies: FullDeputy[] = []) {
  const [deputies, setDeputies] = React.useState(initDeputies);
  const { state, execute } = useFetch();

  const getActiveDeputies = React.useCallback(async () => {
    const { json } = await execute("/ems-fd/active-deputies", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      setDeputies(json);
    }
  }, [execute]);

  React.useEffect(() => {
    getActiveDeputies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useListener(SocketEvents.UpdateEmsFdStatus, () => {
    getActiveDeputies();
  });

  return { activeDeputies: deputies, state };
}
