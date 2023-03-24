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
import type { GetDMVPendingVehiclesData, PostDMVVehiclesData } from "@snailycad/types/api";
import { useInvalidateQuery } from "hooks/use-invalidate-query";

interface Props {
  data: GetDMVPendingVehiclesData;
}

export default function Dmv({ data }: Props) {
  const t = useTranslations("Leo");
  const vT = useTranslations("Vehicles");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { invalidateQuery } = useInvalidateQuery(["officer", "notifications"]);

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: GetDMVPendingVehiclesData) => ({
        data: json.vehicles,
        totalCount: json.totalCount,
      }),
      path: "/leo/dmv",
    },
    initialData: data.vehicles,
    totalCount: data.totalCount,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  async function handleAcceptOrDecline(id: string, type: "ACCEPT" | "DECLINE") {
    const { json } = await execute<PostDMVVehiclesData>({
      path: `/leo/dmv/${id}`,
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
        permissions: [Permissions.ManageDMV],
      }}
      className="dark:text-white"
    >
      <Title>{t("dmv")}</Title>

      {asyncTable.items.length <= 0 ? (
        <p className="mt-5">{t("noVehiclesPendingApprovalInDmv")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((vehicle) => {
            return {
              rowProps: {
                className: vehicle.dmvStatus === "PENDING" ? "opacity-100" : "opacity-50",
              },
              id: vehicle.id,
              citizen: (
                <span className="capitalize">
                  {vehicle.citizen
                    ? `${vehicle.citizen.name} ${vehicle.citizen.surname}`
                    : common("unknown")}
                </span>
              ),
              dmvStatus: <Status fallback="—">{vehicle.dmvStatus}</Status>,
              createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
              plate: vehicle.plate,
              model: vehicle.model.value.value,
              color: vehicle.color,
              registrationStatus: vehicle.registrationStatus.value,
              insuranceStatus: vehicle.insuranceStatus?.value ?? common("none"),
              vinNumber: vehicle.vinNumber,
              actions: (
                <>
                  <Button
                    onPress={() => handleAcceptOrDecline(vehicle.id, "ACCEPT")}
                    disabled={vehicle.dmvStatus !== WhitelistStatus.PENDING || state === "loading"}
                    variant="success"
                    size="xs"
                    isDisabled={vehicle.dmvStatus !== WhitelistStatus.PENDING}
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    onPress={() => handleAcceptOrDecline(vehicle.id, "DECLINE")}
                    disabled={vehicle.dmvStatus !== WhitelistStatus.PENDING || state === "loading"}
                    variant="danger"
                    className="ml-2"
                    size="xs"
                    isDisabled={vehicle.dmvStatus !== WhitelistStatus.PENDING}
                  >
                    {common("decline")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { header: vT("plate"), accessorKey: "plate" },
            { header: vT("owner"), accessorKey: "citizen" },
            { header: vT("dmvStatus"), accessorKey: "dmvStatus" },
            { header: vT("model"), accessorKey: "model" },
            { header: vT("color"), accessorKey: "color" },
            { header: vT("registrationStatus"), accessorKey: "registrationStatus" },
            { header: vT("insuranceStatus"), accessorKey: "insuranceStatus" },
            { header: vT("vinNumber"), accessorKey: "vinNumber" },
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
  const [dmvData] = await requestAll(req, [["/leo/dmv", []]]);

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
