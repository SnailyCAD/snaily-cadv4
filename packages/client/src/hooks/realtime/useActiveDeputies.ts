import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { FullDeputy, useDispatchState } from "state/dispatchState";
import { useEmsFdState } from "state/emsFdState";

export function useActiveDeputies(initDeputies: FullDeputy[] = []) {
  const [deputies, setDeputies] = React.useState(initDeputies);
  const { setActiveDeputies } = useDispatchState();
  const { setActiveDeputy } = useEmsFdState();
  const { state, execute } = useFetch();
  const { user } = useAuth();

  const getActiveDeputies = React.useCallback(async () => {
    const { json } = await execute("/ems-fd/active-deputies", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      setDeputies(json);
      setActiveDeputies(json);

      const activeOfficer = json.find((v) => v.userId === user?.id);
      if (activeOfficer) {
        setActiveDeputy(activeOfficer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  React.useEffect(() => {
    getActiveDeputies();
  }, [getActiveDeputies]);

  useListener(SocketEvents.UpdateEmsFdStatus, () => {
    getActiveDeputies();
  });

  return { activeDeputies: deputies, state };
}
