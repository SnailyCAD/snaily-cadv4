import type { GetMyOfficersData } from "@snailycad/types/api";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";

export function useUserOfficers(options?: { enabled?: boolean }) {
  const { execute } = useFetch();

  const { data, isLoading } = useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...(options ?? {}),
    queryKey: ["/leo"],
    queryFn: async () => {
      const { json } = await execute<GetMyOfficersData>({ path: "/leo" });

      if (Array.isArray(json.officers)) {
        return json.officers;
      }

      return [];
    },
  });

  return { userOfficers: data ?? [], isLoading };
}
