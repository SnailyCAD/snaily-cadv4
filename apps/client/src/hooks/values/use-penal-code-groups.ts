import * as React from "react";
import useFetch from "lib/useFetch";
import type { PenalCodeGroup } from "@snailycad/types";

export function usePenalCodeGroups() {
  const { state, execute } = useFetch();
  const fetched = React.useRef<boolean>(false);

  const [groups, setGroups] = React.useState<PenalCodeGroup[]>([]);

  const fetchValues = React.useCallback(async () => {
    const { json } = await execute({
      path: "/admin/penal-code-group",
      method: "GET",
    });

    if (Array.isArray(json)) {
      setGroups(json);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!fetched.current) {
      fetchValues();
      fetched.current = true;
    }
  }, [fetchValues]);

  return { groups, setGroups, isLoading: state === "loading" };
}
