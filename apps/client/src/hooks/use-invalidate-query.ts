import { useQueryClient } from "@tanstack/react-query";

/**
 * this hook is used to invalidate a query by passing parts of the `queryKey`. This is useful when you
 * want to invalidate a query where you don't have access to the full `queryKey`
 */
export function useInvalidateQuery<T extends unknown[]>(queryKeyParts: T) {
  const queryClient = useQueryClient();

  const queries = queryClient.getQueryCache().findAll();
  const query = queries.find((q) => queryKeyParts.every((k) => q.queryKey.includes(k)));

  async function invalidateQuery() {
    await queryClient.invalidateQueries(query?.queryKey);
    return queryKeyParts;
  }

  return { invalidateQuery };
}
