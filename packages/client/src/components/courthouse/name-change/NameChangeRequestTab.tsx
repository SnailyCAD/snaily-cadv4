import * as React from "react";
import { Button } from "components/Button";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "context/ModalContext";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Table } from "components/shared/Table";
import { NameChangeRequest, WhitelistStatus } from "@snailycad/types";
import { Status } from "components/shared/Status";
import { FullDate } from "components/shared/FullDate";
import { RequestNameChangeModal } from "./RequestNameChange";

interface Props {
  requests: NameChangeRequest[];
}

export function NameChangeRequestTab(props: Props) {
  const [requests, setRequests] = React.useState(props.requests);
  const t = useTranslations("Courthouse");
  const { openModal } = useModal();
  const common = useTranslations("Common");

  return (
    <TabsContent value="nameChangeRequestsTab">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("nameChangeRequests")}</h3>

        <Button onClick={() => openModal(ModalIds.RequestNameChange)}>
          {t("requestNameChange")}
        </Button>
      </header>

      {requests.length <= 0 ? (
        <p className="mt-5">{t("noNameChangeRequests")}</p>
      ) : (
        <Table
          defaultSort={{ columnId: "createdAt", descending: true }}
          data={requests.map((request) => ({
            rowProps: {
              className: request.status !== WhitelistStatus.PENDING ? "opacity-50" : "",
            },
            citizen: `${request.citizen.name} ${request.citizen.surname}`,
            newName: `${request.newName} ${request.newSurname}`,
            status: <Status state={request.status}>{request.status.toLowerCase()}</Status>,
            createdAt: <FullDate>{request.createdAt}</FullDate>,
          }))}
          columns={[
            { Header: common("citizen"), accessor: "citizen" },
            { Header: "new name", accessor: "newName" },
            { Header: "status", accessor: "status" },
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}

      <RequestNameChangeModal onCreate={(request) => setRequests((p) => [request, ...p])} />
    </TabsContent>
  );
}
