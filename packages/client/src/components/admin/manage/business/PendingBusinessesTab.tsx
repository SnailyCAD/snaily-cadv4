import { Tab } from "@headlessui/react";
import { Button } from "components/Button";
import { Table } from "components/table/Table";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { FullBusiness } from "src/pages/admin/manage/businesses";
import { WhitelistStatus } from "types/prisma";

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
    <Tab.Panel className="mt-3">
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
                onClick={() => acceptOrDecline(business, "ACCEPTED")}
                disabled={state === "loading"}
                small
                variant="success"
              >
                {common("accept")}
              </Button>
              <Button
                className="ml-2"
                onClick={() => acceptOrDecline(business, "DECLINED")}
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
    </Tab.Panel>
  );
}
