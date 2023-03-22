import { Button, TabsContent } from "@snailycad/ui";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { WhitelistStatus } from "@snailycad/types";
import type { GetManageBusinessesData, PutManageBusinessesData } from "@snailycad/types/api";
import { useInvalidateQuery } from "hooks/use-invalidate-query";

type Business = GetManageBusinessesData["businesses"][number];

export function PendingBusinessesTab() {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const tableState = useTableState();
  const { state, execute } = useFetch();
  const { invalidateQuery } = useInvalidateQuery(["/admin/manage/businesses"]);

  const asyncTable = useAsyncTable<Business>({
    fetchOptions: {
      path: "/admin/manage/businesses?pendingOnly=true",
      onResponse: (json: GetManageBusinessesData) => ({
        data: json.businesses,
        totalCount: json.totalCount,
      }),
    },
  });

  async function acceptOrDecline(business: Business, type: WhitelistStatus) {
    const { json } = await execute<PutManageBusinessesData>({
      path: `/admin/manage/businesses/${business.id}`,
      method: "PUT",
      data: { status: type },
    });

    if (json) {
      await invalidateQuery();
      asyncTable.remove(business.id);
    }
  }

  return (
    <TabsContent
      tabName={`${t("pendingBusinesses")} ${
        asyncTable.isInitialLoading ? "" : ` (${asyncTable.pagination.totalDataCount})`
      }`}
      aria-label={t("pendingBusinesses")}
      value="pendingBusinesses"
    >
      <h2 className="text-2xl font-semibold mb-2">{t("pendingBusinesses")}</h2>
      <p className="text-neutral-700 dark:text-gray-400">{t("info_pendingBusinesses")}</p>

      <Table
        isLoading={asyncTable.isInitialLoading}
        tableState={tableState}
        data={asyncTable.items.map((business) => ({
          id: business.id,
          name: business.name,
          owner: `${business.citizen.name} ${business.citizen.surname}`,
          user: business.user.username,
          actions: (
            <>
              <Button
                onPress={() => acceptOrDecline(business, WhitelistStatus.ACCEPTED)}
                disabled={state === "loading"}
                size="xs"
                variant="success"
              >
                {common("accept")}
              </Button>
              <Button
                className="ml-2"
                onPress={() => acceptOrDecline(business, WhitelistStatus.DECLINED)}
                disabled={state === "loading"}
                size="xs"
                variant="danger"
              >
                {common("decline")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { header: common("name"), accessorKey: "name" },
          { header: t("owner"), accessorKey: "owner" },
          { header: t("user"), accessorKey: "user" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />
    </TabsContent>
  );
}
