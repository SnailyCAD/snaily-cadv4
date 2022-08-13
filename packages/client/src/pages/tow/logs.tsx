import * as React from "react";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { requestAll } from "lib/utils";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { Button } from "components/Button";
import dynamic from "next/dynamic";
import { FullDate } from "components/shared/FullDate";
import type { TowCall } from "@snailycad/types";
import { Permissions } from "@snailycad/permissions";
import type { GetTowCallsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

interface Props {
  calls: GetTowCallsData;
}

export default function TowLogs(props: Props) {
  const [calls, setCalls] = React.useState<TowCall[]>(props.calls);
  const [tempCall, callState] = useTemporaryItem(calls);
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { openModal } = useModal();

  useListener(SocketEvents.EndTowCall, handleCallEnd);

  function handleCallEnd(call: TowCall) {
    setCalls((p) => [call, ...p]);
  }

  function handleViewDescription(call: TowCall) {
    callState.setTempId(call.id);
    openModal(ModalIds.Description, call);
  }

  function assignedUnit(call: TowCall) {
    return call.assignedUnit ? (
      <span>
        {call.assignedUnit.name} {call.assignedUnit.surname}
      </span>
    ) : (
      <span>{common("none")}</span>
    );
  }

  React.useEffect(() => {
    setCalls(props.calls);
  }, [props.calls]);

  return (
    <Layout
      permissions={{ fallback: (u) => u.isTow, permissions: [Permissions.ViewTowLogs] }}
      className="dark:text-white"
    >
      <Title>{t("towLogs")}</Title>

      {calls.length <= 0 ? (
        <p className="mt-5">{t("noTowCalls")}</p>
      ) : (
        <Table
          data={calls.map((call) => ({
            location: call.location,
            postal: call.postal || common("none"),
            description:
              call.description && !call.descriptionData ? (
                call.description
              ) : (
                <Button size="xs" onClick={() => handleViewDescription(call)}>
                  {common("viewDescription")}
                </Button>
              ),
            caller: call.creator ? `${call.creator.name} ${call.creator.surname}` : "Dispatch",
            assignedUnit: assignedUnit(call),
            createdAt: <FullDate>{call.createdAt}</FullDate>,
          }))}
          columns={[
            { header: t("location"), accessorKey: "location" },
            { header: t("postal"), accessorKey: "postal" },
            { header: common("description"), accessorKey: "description" },
            { header: t("caller"), accessorKey: "caller" },
            { header: t("assignedUnit"), accessorKey: "assignedUnit" },
            { header: common("createdAt"), accessorKey: "createdAt" },
          ]}
        />
      )}

      {tempCall ? (
        <DescriptionModal
          onClose={() => callState.setTempId(null)}
          value={tempCall.descriptionData}
        />
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/tow?ended=true", []]]);

  return {
    props: {
      calls: data,
      session: user,
      messages: {
        ...(await getTranslations(["calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
