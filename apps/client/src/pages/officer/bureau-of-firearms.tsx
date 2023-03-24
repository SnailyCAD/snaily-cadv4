import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { WhitelistStatus } from "@snailycad/types";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { Permissions } from "hooks/usePermission";
import useFetch from "lib/useFetch";
import { Status } from "components/shared/Status";
import type { PostBOFData, GetPendingBOFWeapons } from "@snailycad/types/api";
import { useInvalidateQuery } from "hooks/use-invalidate-query";

interface Props {
  data: GetPendingBOFWeapons;
}

export default function BureauOfFirearms({ data }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { invalidateQuery } = useInvalidateQuery(["officer", "notifications"]);

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: GetPendingBOFWeapons) => ({
        data: json.weapons,
        totalCount: json.totalCount,
      }),
      path: "/leo/bureau-of-firearms",
    },
    initialData: data.weapons,
    totalCount: data.totalCount,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  async function handleAcceptOrDecline(id: string, type: "ACCEPT" | "DECLINE") {
    const { json } = await execute<PostBOFData>({
      path: `/leo/bureau-of-firearms/${id}`,
      method: "POST",
      data: { type },
    });

    if (json) {
      await invalidateQuery();
      asyncTable.update(id, json);
    }
  }

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ManageBureauOfFirearms],
      }}
      className="dark:text-white"
    >
      <Title>{t("Bof.bureauOfFirearms")}</Title>

      {asyncTable.items.length <= 0 ? (
        <p className="mt-5">{t("Bof.noWeaponsPendingBof")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((weapon) => {
            return {
              rowProps: {
                className: weapon.bofStatus === "PENDING" ? "opacity-100" : "opacity-50",
              },
              id: weapon.id,
              owner: `${weapon.citizen.name} ${weapon.citizen.surname}`,
              model: weapon.model.value.value,
              registrationStatus: weapon.registrationStatus.value,
              serialNumber: weapon.serialNumber,
              bofStatus: <Status fallback="—">{weapon.bofStatus}</Status>,
              createdAt: <FullDate onlyDate>{weapon.createdAt}</FullDate>,
              actions: (
                <>
                  <Button
                    onPress={() => handleAcceptOrDecline(weapon.id, "ACCEPT")}
                    disabled={weapon.bofStatus !== WhitelistStatus.PENDING || state === "loading"}
                    variant="success"
                    size="xs"
                    isDisabled={weapon.bofStatus !== WhitelistStatus.PENDING}
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    onPress={() => handleAcceptOrDecline(weapon.id, "DECLINE")}
                    disabled={weapon.bofStatus !== WhitelistStatus.PENDING || state === "loading"}
                    variant="danger"
                    className="ml-2"
                    size="xs"
                    isDisabled={weapon.bofStatus !== WhitelistStatus.PENDING}
                  >
                    {common("decline")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { header: t("Vehicles.owner"), accessorKey: "owner" },
            { header: t("Weapons.model"), accessorKey: "model" },
            { header: t("Weapons.registrationStatus"), accessorKey: "registrationStatus" },
            { header: t("Weapons.serialNumber"), accessorKey: "serialNumber" },
            { header: t("Weapons.bofStatus"), accessorKey: "bofStatus" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [dmvData] = await requestAll(req, [["/leo/bureau-of-firearms", []]]);

  return {
    props: {
      session: user,
      data: dmvData,
      messages: {
        ...(await getTranslations(["leo", "citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};
