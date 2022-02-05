import { TabsContent } from "components/shared/TabList";
import { Button } from "components/Button";
import { Table } from "components/shared/Table";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import type { FullBusiness } from "src/pages/admin/manage/businesses";
import { WhitelistStatus } from "@snailycad/types";

interface Props {
  businesses: FullBusiness[];
  setBusinesses: React.Dispatch<React.SetStateAction<FullBusiness[]>>;
}

export function PendingBusinessesTab({ setBusinesses, businesses }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");

  const { state, execute } = useFetch();

  async function acceptOrDecline(business: FullBusiness, type: WhitelistStatus) {
    const { json } = await execute(`/admin/manage/businesses/${business.id}`, {
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
      <p className="text-gray-300">{t("info_pendingBusinesses")}</p>

      <Table
        data={businesses.map((business) => ({
          name: business.name,
          owner: `${business.citizen.name} ${business.citizen.surname}`,
          user: business.user.username,
          actions: (
            <>
              <Button
                onClick={() => acceptOrDecline(business, WhitelistStatus.ACCEPTED)}
                disabled={state === "loading"}
                small
                variant="success"
              >
                {common("accept")}
              </Button>
              <Button
                className="ml-2"
                onClick={() => acceptOrDecline(business, WhitelistStatus.DECLINED)}
                disabled={state === "loading"}
                small
                variant="danger"
              >
                {common("decline")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { Header: common("name"), accessor: "name" },
          { Header: t("owner"), accessor: "owner" },
          { Header: t("user"), accessor: "user" },
          { Header: common("actions"), accessor: "actions" },
        ]}
      />
    </TabsContent>
  );
}
