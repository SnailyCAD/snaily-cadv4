import * as React from "react";
import useFetch from "lib/useFetch";
import { useAuth } from "context/AuthContext";
import { useLeoState } from "state/leoState";
import type { GetActiveWarrantsData } from "@snailycad/types/api";

let ran = false;
export function useActiveWarrants() {
  const { user } = useAuth();
  const { state, execute } = useFetch();
  const { activeWarrants, setActiveWarrants } = useLeoState();

  const handleState = React.useCallback(
    (data: any[]) => {
      setActiveWarrants(data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const getActiveWarrants = React.useCallback(async () => {
    const { json } = await execute<GetActiveWarrantsData>({
      path: "/records/active-warrants",
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      handleState(json);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, handleState]);

  React.useEffect(() => {
    if (!ran) {
      getActiveWarrants();
      ran = true;
    }
  }, [getActiveWarrants]);

  // todo: add socket listeners

  return { activeWarrants, setActiveWarrants, state };
}
