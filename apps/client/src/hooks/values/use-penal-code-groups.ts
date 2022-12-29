import * as React from "react";
import useFetch from "lib/useFetch";
import type { PenalCodeGroup } from "@snailycad/types";
import { useQuery } from "@tanstack/react-query";
import type { GetPenalCodeGroupsData } from "@snailycad/types/api";

export function usePenalCodeGroups() {
  const { state, execute } = useFetch();
  const [groups, setGroups] = React.useState<PenalCodeGroup[]>([]);

  useQuery({
    queryKey: ["/admin/penal-code-group"],
    queryFn: fetchValues,
  });

  async function fetchValues() {
    const { json } = await execute<GetPenalCodeGroupsData>({
      path: "/admin/penal-code-group?includeAll=true",
      method: "GET",
    });

    if (Array.isArray(json.groups)) {
      setGroups(json.groups);
      return json.groups;
    }

    return [];
  }

  return { groups, setGroups, isLoading: state === "loading" };
}
