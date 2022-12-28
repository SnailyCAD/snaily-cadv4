import * as React from "react";
import useFetch from "lib/useFetch";
import type { PenalCodeGroup } from "@snailycad/types";
import { useQuery } from "@tanstack/react-query";

export function usePenalCodeGroups() {
  const { state, execute } = useFetch();
  const [groups, setGroups] = React.useState<PenalCodeGroup[]>([]);

  useQuery({
    queryKey: ["/admin/penal-code-group"],
    queryFn: fetchValues,
  });

  async function fetchValues() {
    const { json } = await execute({
      path: "/admin/penal-code-group",
      method: "GET",
    });

    if (Array.isArray(json)) {
      setGroups(json);
      return json;
    }

    return [];
  }

  return { groups, setGroups, isLoading: state === "loading" };
}
