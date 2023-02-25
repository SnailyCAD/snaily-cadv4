import { Button, TabsContent } from "@snailycad/ui";
import { Table, useTableState } from "components/shared/Table";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { WhitelistStatus } from "@snailycad/types";
import type { GetManageBusinessesData, PutManageBusinessesData } from "@snailycad/types/api";

interface Props {
  businesses: GetManageBusinessesData;
  setBusinesses: React.Dispatch<React.SetStateAction<GetManageBusinessesData>>;
}

export function PendingBusinessesTab({ setBusinesses, businesses }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const tableState = useTableState();
  const { state, execute } = useFetch();

  async function acceptOrDecline(business: GetManageBusinessesData[number], type: WhitelistStatus) {
    const { json } = await execute<PutManageBusinessesData>({
      path: `/admin/manage/businesses/${business.id}`,
      method: "PUT",
      data: { status: type },
    });

    if (json) {
      setBusinesses((p) => {
        const idx = p.filter((v) => v.id !== business.id);
        return [json, ...idx];
      });
    }
  }

  return (
    <TabsContent aria-label={t("pendingBusinesses")} value="pendingBusinesses">
      <h2 className="text-2xl font-semibold mb-2">{t("pendingBusinesses")}</h2>
      <p className="text-neutral-700 dark:text-gray-400">{t("info_pendingBusinesses")}</p>

      <Table
        tableState={tableState}
        data={businesses.map((business) => ({
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
