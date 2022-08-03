import type { GetMyOfficersData } from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import * as React from "react";
import { useLeoState } from "state/leoState";

export function useFetchUserOfficers() {
  const leoState = useLeoState();
  const { execute } = useFetch();

  async function fetchUserOfficers() {
    const { json } = await execute<GetMyOfficersData>({
      path: "/leo",
      method: "GET",
    });

    if (Array.isArray(json.officers)) {
      leoState.setUserOfficers(json.officers);
    }
  }

  React.useEffect(() => {
    fetchUserOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
