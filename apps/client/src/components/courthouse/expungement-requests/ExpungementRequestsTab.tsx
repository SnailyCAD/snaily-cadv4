import { Table, useTableState } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { ExpungementRequestStatus } from "@snailycad/types";
import dynamic from "next/dynamic";
import { getTitles } from "./RequestExpungement";
import { Status } from "components/shared/Status";
import { FullDate } from "components/shared/FullDate";
import { useModal } from "state/modalState";
import { Button, TabsContent } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import type { GetExpungementRequestsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import useFetch from "lib/useFetch";
import { useList } from "hooks/shared/table/use-list";

const RequestExpungement = dynamic(
  async () => (await import("./RequestExpungement")).RequestExpungement,
  { ssr: false },
);

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});

interface Props {
  requests: GetExpungementRequestsData;
}

export function ExpungementRequestsTab(props: Props) {
  const list = useList({ initialData: props.requests, totalCount: props.requests.length });
  const [tempRequest, requestState] = useTemporaryItem(list.items);

  const common = useTranslations("Common");
  const t = useTranslations("Courthouse");
  const leo = useTranslations("Leo");
  const { closeModal, openModal } = useModal();
  const tableState = useTableState();
  const { execute, state } = useFetch();

  function handleCancelClick(request: GetExpungementRequestsData[number]) {
    openModal(ModalIds.AlertCancelExpungementRequest);
    requestState.setTempId(request.id);
  }

  async function handleCancelRequest() {
    if (!tempRequest) return;

    const { json } = await execute({
      path: `/expungement-requests/${tempRequest.citizenId}/${tempRequest.id}`,
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertCancelExpungementRequest);
      list.update(tempRequest.id, { ...tempRequest, status: ExpungementRequestStatus.CANCELED });
    }
  }

  return (
    <TabsContent value="expungementRequestsTab">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("expungementRequests")}</h3>

        <Button onPress={() => openModal(ModalIds.RequestExpungement)}>
          {t("requestExpungement")}
        </Button>
      </header>

      {list.items.length <= 0 ? (
        <p className="mt-5">{t("noExpungementRequests")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={list.items.map((request) => {
            // accept requests delete the db entity, this results in show "NONE" for the type
            // therefore it shows "ACCEPTED"
            const isDisabled = request.status !== ExpungementRequestStatus.PENDING;
            const warrants =
              request.status === ExpungementRequestStatus.ACCEPTED
                ? "accepted"
                : request.warrants.map((w) => w.description).join(", ") || common("none");

            const arrestReports =
              request.status === ExpungementRequestStatus.ACCEPTED
                ? "accepted"
                : request.records
                    .filter((v) => v.type === "ARREST_REPORT")
                    .map((w) => getTitles(w))
                    .join(", ") || common("none");

            const tickets =
              request.status === ExpungementRequestStatus.ACCEPTED
                ? "accepted"
                : request.records
                    .filter((v) => v.type === "TICKET")
                    .map((w) => getTitles(w))
                    .join(", ") || common("none");

            return {
              id: request.id,
              rowProps: {
                className: isDisabled ? "opacity-50 cursor-not-allowed" : "",
              },
              citizen: `${request.citizen.name} ${request.citizen.surname}`,
              warrants,
              arrestReports,
              tickets,
              status: <Status>{request.status}</Status>,
              createdAt: <FullDate>{request.createdAt}</FullDate>,
              actions: (
                <Button
                  disabled={isDisabled}
                  size="xs"
                  onClick={() => handleCancelClick(request)}
                  variant="danger"
                >
                  {t("cancelRequest")}
                </Button>
              ),
            };
          })}
          columns={[
            { header: leo("citizen"), accessorKey: "citizen" },
            { header: leo("warrants"), accessorKey: "warrants" },
            { header: leo("arrestReports"), accessorKey: "arrestReports" },
            { header: leo("tickets"), accessorKey: "tickets" },
            { header: leo("status"), accessorKey: "status" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <RequestExpungement onSuccess={(json) => list.prepend(json)} />

      <AlertModal
        title={t("cancelRequest")}
        description={t("alert_cancelRequest")}
        onDeleteClick={handleCancelRequest}
        id={ModalIds.AlertCancelExpungementRequest}
        deleteText={t("cancelRequest")}
        onClose={() => requestState.setTempId(null)}
        state={state}
      />
    </TabsContent>
  );
}
