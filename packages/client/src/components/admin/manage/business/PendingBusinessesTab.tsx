import { Tab } from "@headlessui/react";
import { Button } from "components/Button";
import { Table } from "components/table/Table";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { FullBusiness } from "src/pages/admin/manage/businesses";
import { WhitelistStatus } from "types/prisma";

interface Props {
  businesses: FullBusiness[];
  onSuccess(business: FullBusiness): void;
}

export function PendingBusinessesTab({ onSuccess, businesses }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");

  const { state, execute } = useFetch();

  async function acceptOrDecline(id: string, type: WhitelistStatus) {
    const { json } = await execute(`/admin/manage/businesses/${id}`, {
      method: "PUT",
      data: { status: type },
    });

    if (json.id) {
      onSuccess(json);
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
                onClick={() => acceptOrDecline(business.id, "ACCEPTED")}
                disabled={state === "loading"}
                small
                variant="success"
              >
                {common("accept")}
              </Button>
              <Button
                className="ml-2"
                onClick={() => acceptOrDecline(business.id, "DECLINED")}
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
          {
            Header: common("name"),
            accessor: "name",
          },
          {
            Header: t("owner"),
            accessor: "owner",
          },
          {
            Header: t("user"),
            accessor: "user",
          },
          {
            Header: common("actions"),
            accessor: "actions",
          },
        ]}
      />
    </Tab.Panel>
  );
}
