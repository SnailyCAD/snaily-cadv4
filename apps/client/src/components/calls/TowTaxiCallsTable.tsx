import type * as React from "react";
import type { TaxiCall, TowCall } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { FullDate } from "components/shared/FullDate";
import { Table, useTableState } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";
import { usePermission, Permissions } from "hooks/usePermission";
import { useAuth } from "context/AuthContext";
import type { GetTaxiCallsData, GetTowCallsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

const AssignToCallModal = dynamic(
  async () => (await import("components/citizen/tow/AssignToTowCall")).AssignToCallModal,
);
const ManageCallModal = dynamic(
  async () => (await import("components/citizen/tow/manage-tow-call")).ManageCallModal,
);

interface Props {
  noCallsText: string;
  calls: GetTaxiCallsData | GetTowCallsData;
  setCalls: React.Dispatch<React.SetStateAction<(TowCall | TaxiCall)[]>>;
  type: "tow" | "taxi";
}

export function TowTaxiCallsTable({ type, calls, noCallsText, setCalls }: Props) {
  const [tempCall, callState] = useTemporaryItem<string, TowCall | TaxiCall>(calls);

  const { openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");
  const { user } = useAuth();
  const tableState = useTableState();

  const { hasPermissions } = usePermission();
  const fallback = type === "tow" ? user?.isTow : user?.isTaxi;
  const toCheckPerms =
    type === "tow" ? [Permissions.ManageTowCalls] : [Permissions.ManageTaxiCalls];
  const hasManagePermissions = hasPermissions(toCheckPerms, fallback ?? false);

  function assignClick(call: TowCall | TaxiCall) {
    openModal(ModalIds.AssignToTowCall);
    callState.setTempId(call.id);
  }

  function editClick(call: TowCall | TaxiCall) {
    openModal(ModalIds.ManageTowCall);
    callState.setTempId(call.id);
  }

  function updateCalls(old: TowCall | TaxiCall, newC: TowCall | TaxiCall) {
    callState.setTempId(null);
    setCalls((p) => {
      const idx = p.findIndex((v) => v.id === old.id);
      p[idx] = newC;
      return p;
    });
  }

  function handleCallEnd(call: TaxiCall) {
    setCalls((p) => p.filter((v) => v.id !== call.id));
  }

  function assignedUnit(call: TowCall | TaxiCall) {
    return call.assignedUnit ? (
      <span className="capitalize">
        {call.assignedUnit.name} {call.assignedUnit.surname}
      </span>
    ) : (
      <span>{common("none")}</span>
    );
  }

  return (
    <>
      {calls.length <= 0 ? (
        <p className="mt-5">{noCallsText}</p>
      ) : (
        <Table
          tableState={tableState}
          data={calls.map((call) => ({
            id: call.id,
            location: call.location,
            postal: call.postal || common("none"),
            description: <CallDescription nonCard data={call} />,
            caller: call.creator
              ? `${call.creator.name} ${call.creator.surname}`
              : call.name ?? leo("dispatch"),
            assignedUnit: assignedUnit(call),
            createdAt: <FullDate>{call.createdAt}</FullDate>,
            actions: (
              <>
                <Button onPress={() => editClick(call)} size="xs" variant="success">
                  {common("edit")}
                </Button>
                <Button className="ml-2" onPress={() => assignClick(call)} size="xs">
                  {t("assignToCall")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: t("location"), accessorKey: "location" },
            { header: t("postal"), accessorKey: "postal" },
            { header: common("description"), accessorKey: "description" },
            { header: t("caller"), accessorKey: "caller" },
            { header: t("assignedUnit"), accessorKey: "assignedUnit" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      <AssignToCallModal
        onClose={() => callState.setTempId(null)}
        onSuccess={updateCalls}
        call={tempCall}
      />
      <ManageCallModal
        onClose={() => callState.setTempId(null)}
        onDelete={handleCallEnd}
        onUpdate={updateCalls}
        onCreate={(call) => {
          setCalls((p) => [call, ...p]);
        }}
        call={tempCall}
      />
    </>
  );
}
