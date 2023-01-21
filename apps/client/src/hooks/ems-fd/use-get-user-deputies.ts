import type { GetMyDeputiesData } from "@snailycad/types/api";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";

export function useGetUserDeputies(options?: { enabled?: boolean }) {
  const { execute } = useFetch();

  const { data, isLoading } = useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...(options ?? {}),
    queryKey: ["/ems-fd"],
    queryFn: async () => {
      const { json } = await execute<GetMyDeputiesData>({ path: "/ems-fd" });

      if (Array.isArray(json.deputies)) {
        return json.deputies;
      }

      return [];
    },
  });

  return { userDeputies: data ?? [], isLoading };
}
