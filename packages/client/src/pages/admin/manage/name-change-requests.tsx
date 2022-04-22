import * as React from "react";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { Table } from "components/shared/Table";
import { type NameChangeRequest, WhitelistStatus, Rank } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { Button } from "components/Button";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { Status } from "components/shared/Status";
import { usePermission, Permissions } from "hooks/usePermission";

interface Props {
  requests: NameChangeRequest[];
}

export default function SupervisorPanelPage({ requests: data }: Props) {
  const [requests, setRequests] = React.useState(data);

  const t = useTranslations();
  const common = useTranslations("Common");
  const pendingRequests = requests.filter((v) => v.status === WhitelistStatus.PENDING);
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageNameChangeRequests], true);

  const { state, execute } = useFetch();

  async function handleUpdate(id: string, type: WhitelistStatus) {
    const { json } = await execute(`/admin/manage/name-change-requests/${id}`, {
      method: "PUT",
      data: { type },
    });

    if (json) {
      setRequests((p) => p.filter((v) => v.id !== json.id));
    }
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ViewNameChangeRequests, Permissions.ManageNameChangeRequests],
      }}
    >
      <Title>{t("Management.MANAGE_NAME_CHANGE_REQUESTS")}</Title>

      {pendingRequests.length <= 0 ? (
        <p className="my-2">{t("Courthouse.noNameChangeRequests")}</p>
      ) : (
        <Table
          data={pendingRequests.map((request) => ({
            citizen: `${request.citizen.name} ${request.citizen.surname}`,
            newName: `${request.newName} ${request.newSurname}`,
            status: <Status state={request.status}>{request.status.toLowerCase()}</Status>,
            createdAt: <FullDate>{request.createdAt}</FullDate>,
            actions: (
              <>
                <Button
                  disabled={state === "loading"}
                  onClick={() => handleUpdate(request.id, WhitelistStatus.ACCEPTED)}
                  variant="success"
                  small
                >
                  {common("accept")}
                </Button>
                <Button
                  className="ml-2"
                  disabled={state === "loading"}
                  onClick={() => handleUpdate(request.id, WhitelistStatus.DECLINED)}
                  variant="danger"
                  small
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: common("citizen"), accessor: "citizen" },
            { Header: t("Courthouse.newName"), accessor: "newName" },
            { Header: t("Courthouse.status"), accessor: "status" },
            { Header: common("createdAt"), accessor: "createdAt" },
            hasManagePermissions ? { Header: common("actions"), accessor: "actions" } : null,
          ]}
        />
      )}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [requests] = await requestAll(req, [["/admin/manage/name-change-requests", []]]);

  return {
    props: {
      requests,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "courthouse", "values", "common"], locale)),
      },
    },
  };
};
