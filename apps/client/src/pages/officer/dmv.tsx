import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { WhitelistStatus } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { Permissions } from "hooks/usePermission";
import useFetch from "lib/useFetch";
import { Status } from "components/shared/Status";
import type { GetDMVPendingVehiclesData, PostDMVVehiclesData } from "@snailycad/types/api";

interface Props {
  data: GetDMVPendingVehiclesData;
}

export default function Dmv({ data }: Props) {
  const [pendingVehicles, setPendingVehicles] = React.useState(data);
  const t = useTranslations("Leo");
  const vT = useTranslations("Vehicles");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const tableState = useTableState();

  async function handleAcceptOrDecline(id: string, type: "ACCEPT" | "DECLINE") {
    const { json } = await execute<PostDMVVehiclesData>({
      path: `/leo/dmv/${id}`,
      method: "POST",
      data: { type },
    });

    if (json) {
      const copy = [...pendingVehicles];
      const idx = copy.findIndex((v) => v.id === id);
      copy[idx] = json;

      setPendingVehicles(copy);
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

      {pendingVehicles.length <= 0 ? (
        <p className="mt-5">{t("noVehiclesPendingApprovalInDmv")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={pendingVehicles.map((vehicle) => {
            return {
              id: vehicle.id,
              citizen: (
                <span className="capitalize">
                  {vehicle.citizen.name} {vehicle.citizen.surname}
                </span>
              ),
              createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
              plate: vehicle.plate,
              model: vehicle.model.value.value,
              color: vehicle.color,
              registrationStatus: vehicle.registrationStatus.value,
              insuranceStatus: vehicle.insuranceStatus?.value ?? common("none"),
              vinNumber: vehicle.vinNumber,
              dmvStatus: (
                <Status state={vehicle.dmvStatus}>{vehicle.dmvStatus?.toLowerCase()}</Status>
              ),
              actions: (
                <>
                  <Button
                    onPress={() => handleAcceptOrDecline(vehicle.id, "ACCEPT")}
                    disabled={vehicle.dmvStatus !== WhitelistStatus.PENDING || state === "loading"}
                    variant="success"
                    size="xs"
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    onPress={() => handleAcceptOrDecline(vehicle.id, "DECLINE")}
                    disabled={vehicle.dmvStatus !== WhitelistStatus.PENDING || state === "loading"}
                    variant="danger"
                    className="ml-2"
                    size="xs"
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
            { header: vT("model"), accessorKey: "model" },
            { header: vT("color"), accessorKey: "color" },
            { header: vT("registrationStatus"), accessorKey: "registrationStatus" },
            { header: vT("insuranceStatus"), accessorKey: "insuranceStatus" },
            { header: vT("vinNumber"), accessorKey: "vinNumber" },
            { header: vT("dmvStatus"), accessorKey: "dmvStatus" },
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
