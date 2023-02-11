import dynamic from "next/dynamic";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { useModal } from "state/modalState";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import type { DeleteTruckLogsData, GetTruckLogsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});
const ManageTruckLogModal = dynamic(
  async () => (await import("components/truck-logs/manage-truck-log-modal")).ManageTruckLogModal,
  { ssr: false },
);

export default function TruckLogs({ logs: initialLogs, totalCount }: GetTruckLogsData) {
  const { openModal, closeModal } = useModal();

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: GetTruckLogsData) => ({ data: json.logs, totalCount: json.totalCount }),
      path: "/truck-logs",
    },
    totalCount,
    initialData: initialLogs,
  });

  const [tempLog, logState] = useTemporaryItem(asyncTable.items);
  const tableState = useTableState({ pagination: asyncTable.pagination });

  const t = useTranslations("TruckLogs");
  const common = useTranslations("Common");
  const { execute, state } = useFetch();

  async function handleDelete() {
    if (!tempLog) return;

    const { json } = await execute<DeleteTruckLogsData>({
      path: `/truck-logs/${tempLog.id}`,
      method: "DELETE",
    });

    if (json) {
      asyncTable.remove(tempLog.id);
      logState.setTempId(null);
      closeModal(ModalIds.AlertDeleteTruckLog);
    }
  }

  function handleEditClick(log: GetTruckLogsData["logs"][number]) {
    logState.setTempId(log.id);
    openModal(ModalIds.ManageTruckLog);
  }

  function handleDeleteClick(log: GetTruckLogsData["logs"][number]) {
    logState.setTempId(log.id);
    openModal(ModalIds.AlertDeleteTruckLog);
  }

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between">
        <Title>{t("truckLogs")}</Title>

        <Button onPress={() => openModal(ModalIds.ManageTruckLog)}>{t("createTruckLog")}</Button>
      </header>

      {asyncTable.items.length <= 0 ? (
        <p className="mt-3">{t("noTruckLogs")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((log) => ({
            id: log.id,
            driver: log.citizen ? `${log.citizen.name} ${log.citizen.surname}` : "—",
            vehicle: log.vehicle?.model.value.value,
            startedAt: log.startedAt,
            endedAt: log.endedAt,
            notes: log.notes ?? common("none"),
            actions: (
              <>
                <Button onPress={() => handleEditClick(log)} size="xs" variant="success">
                  {common("edit")}
                </Button>
                <Button
                  onPress={() => handleDeleteClick(log)}
                  className="ml-2"
                  size="xs"
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: t("driver"), accessorKey: "driver" },
            { header: t("vehicle"), accessorKey: "vehicle" },
            { header: t("startedAt"), accessorKey: "startedAt" },
            { header: t("endedAt"), accessorKey: "endedAt" },
            { header: t("notes"), accessorKey: "notes" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <ManageTruckLogModal
        onCreate={(log) => asyncTable.append(log)}
        onUpdate={(previousLog, newLog) => asyncTable.update(previousLog.id, newLog)}
        onClose={() => logState.setTempId(null)}
        log={tempLog}
      />

      <AlertModal
        title={t("deleteTruckLog")}
        description={t("alert_deleteTruckLog")}
        onDeleteClick={handleDelete}
        id={ModalIds.AlertDeleteTruckLog}
        onClose={() => logState.setTempId(null)}
        state={state}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<GetTruckLogsData> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [logsData] = await requestAll(req, [["/truck-logs", { logs: [], totalCount: 0 }]]);

  return {
    props: {
      ...logsData,
      session: user,
      messages: {
        ...(await getTranslations(["truck-logs", "common"], user?.locale ?? locale)),
      },
    },
  };
};
