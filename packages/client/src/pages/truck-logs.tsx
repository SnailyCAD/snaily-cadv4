import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { useModal } from "state/modalState";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { ModalIds } from "types/ModalIds";
import type { RegisteredVehicle, TruckLog } from "@snailycad/types";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const ManageTruckLogModal = dynamic(
  async () => (await import("components/truck-logs/ManageTruckLog")).ManageTruckLogModal,
);

interface Props {
  truckLogs: TruckLog[];
  registeredVehicles: RegisteredVehicle[];
}

export default function TruckLogs({ registeredVehicles, truckLogs }: Props) {
  const { openModal, closeModal } = useModal();
  const [logs, setLogs] = React.useState(truckLogs);
  const [tempLog, setTempLog] = React.useState<TruckLog | null>(null);

  const t = useTranslations("TruckLogs");
  const common = useTranslations("Common");
  const { execute, state } = useFetch();

  async function handleDelete() {
    if (!tempLog) return;

    const { json } = await execute(`/truck-logs/${tempLog.id}`, { method: "DELETE" });

    if (json) {
      setLogs((p) => p.filter((v) => v.id !== tempLog.id));
      setTempLog(null);
      closeModal(ModalIds.AlertDeleteTruckLog);
    }
  }

  function handleEditClick(log: TruckLog) {
    setTempLog(log);
    openModal(ModalIds.ManageTruckLog);
  }

  function handleDeleteClick(log: TruckLog) {
    setTempLog(log);
    openModal(ModalIds.AlertDeleteTruckLog);
  }

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between">
        <Title>{t("truckLogs")}</Title>

        <Button onClick={() => openModal(ModalIds.ManageTruckLog)}>{t("createTruckLog")}</Button>
      </header>

      {logs.length <= 0 ? (
        <p className="mt-3">{t("noTruckLogs")}</p>
      ) : (
        <Table
          data={logs.map((log) => ({
            driver: `${log.citizen.name} ${log.citizen.surname}`,
            vehicle: log.vehicle?.model.value.value,
            startedAt: log.startedAt,
            endedAt: log.endedAt,
            notes: log.notes ?? common("none"),
            actions: (
              <>
                <Button onClick={() => handleEditClick(log)} size="xs" variant="success">
                  {common("edit")}
                </Button>
                <Button
                  onClick={() => handleDeleteClick(log)}
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
            { Header: t("driver"), accessor: "driver" },
            { Header: t("vehicle"), accessor: "vehicle" },
            { Header: t("startedAt"), accessor: "startedAt" },
            { Header: t("endedAt"), accessor: "endedAt" },
            { Header: t("notes"), accessor: "notes" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <ManageTruckLogModal
        onCreate={(log) => {
          setLogs((p) => [log, ...p]);
        }}
        onUpdate={(old, log) => {
          setLogs((p) => {
            const idx = p.indexOf(old);
            p[idx] = log;
            return p;
          });
        }}
        log={tempLog}
        registeredVehicles={registeredVehicles}
        onClose={() => setTempLog(null)}
      />

      <AlertModal
        title={t("deleteTruckLog")}
        description={t("alert_deleteTruckLog")}
        onDeleteClick={handleDelete}
        id={ModalIds.AlertDeleteTruckLog}
        state={state}
        onClose={() => setTempLog(null)}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [{ logs, registeredVehicles }] = await requestAll(req, [
    ["/truck-logs", { logs: [], registeredVehicles: [] }],
  ]);

  return {
    props: {
      truckLogs: logs,
      registeredVehicles,
      session: user,
      messages: {
        ...(await getTranslations(["truck-logs", "common"], user?.locale ?? locale)),
      },
    },
  };
};
