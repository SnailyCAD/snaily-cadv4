import * as React from "react";
import { Button, FullDate, Status, TabsContent } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { Table, useTableState } from "components/shared/Table";
import { WhitelistStatus } from "@snailycad/types";
import { RequestNameChangeModal } from "./request-name-change-modal";
import type { GetNameChangeRequestsData } from "@snailycad/types/api";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

interface Props {
  requests: GetNameChangeRequestsData;
}

export function NameChangeRequestTab(props: Props) {
  const [requests, setRequests] = React.useState(props.requests);
  const t = useTranslations("Courthouse");
  const modalState = useModal();
  const common = useTranslations("Common");
  const tableState = useTableState();

  return (
    <TabsContent value="nameChangeRequestsTab">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("nameChangeRequests")}</h3>

        <Button onPress={() => modalState.openModal(ModalIds.RequestNameChange)}>
          {t("requestNameChange")}
        </Button>
      </header>

      {requests.length <= 0 ? (
        <p className="mt-5">{t("noNameChangeRequests")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={requests.map((request) => ({
            id: request.id,
            rowProps: {
              className: request.status !== WhitelistStatus.PENDING ? "opacity-50" : "",
            },
            citizen: `${request.citizen.name} ${request.citizen.surname}`,
            newName: `${request.newName} ${request.newSurname}`,
            description: <CallDescription data={{ description: request.description }} />,
            status: <Status>{request.status}</Status>,
            createdAt: <FullDate>{request.createdAt}</FullDate>,
          }))}
          columns={[
            { header: common("citizen"), accessorKey: "citizen" },
            { header: "new name", accessorKey: "newName" },
            { header: common("description"), accessorKey: "description" },
            { header: "status", accessorKey: "status" },
            { header: common("createdAt"), accessorKey: "createdAt" },
          ]}
        />
      )}

      <RequestNameChangeModal onCreate={(request) => setRequests((p) => [request, ...p])} />
    </TabsContent>
  );
}
