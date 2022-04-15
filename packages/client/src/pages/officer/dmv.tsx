import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { RegisteredVehicle, WhitelistStatus } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { Permissions } from "hooks/usePermission";
import useFetch from "lib/useFetch";
import { Status } from "components/shared/Status";

interface Props {
  data: RegisteredVehicle[];
}

export default function Dmv({ data }: Props) {
  const [pendingVehicles, setPendingVehicles] = React.useState(data);
  const t = useTranslations("Leo");
  const vT = useTranslations("Vehicles");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();

  async function handleAcceptOrDecline(id: string, type: "ACCEPT" | "DECLINE") {
    const { json } = await execute(`/leo/dmv/${id}`, {
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
          defaultSort={{ columnId: "createdAt", descending: true }}
          data={pendingVehicles.map((vehicle) => {
            return {
              citizen: `${vehicle.citizen.name} ${vehicle.citizen.surname}`,
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
                    onClick={() => handleAcceptOrDecline(vehicle.id, "ACCEPT")}
                    disabled={vehicle.dmvStatus !== WhitelistStatus.PENDING || state === "loading"}
                    variant="success"
                    small
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    onClick={() => handleAcceptOrDecline(vehicle.id, "DECLINE")}
                    disabled={vehicle.dmvStatus !== WhitelistStatus.PENDING || state === "loading"}
                    variant="danger"
                    className="ml-2"
                    small
                  >
                    {common("decline")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { Header: vT("plate"), accessor: "plate" },
            { Header: vT("model"), accessor: "model" },
            { Header: vT("color"), accessor: "color" },
            { Header: vT("registrationStatus"), accessor: "registrationStatus" },
            { Header: vT("insuranceStatus"), accessor: "insuranceStatus" },
            { Header: vT("vinNumber"), accessor: "vinNumber" },
            { Header: vT("dmvStatus"), accessor: "dmvStatus" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [dmvData] = await requestAll(req, [["/leo/dmv", []]]);

  return {
    props: {
      session: await getSessionUser(req),
      data: dmvData,
      messages: {
        ...(await getTranslations(["leo", "citizen", "common"], locale)),
      },
    },
  };
};
