import * as React from "react";
import type { TaxiCall, TowCall } from "@snailycad/types";
import { Button, FullDate } from "@snailycad/ui";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import dynamic from "next/dynamic";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetTaxiCallsData, GetTowCallsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { SearchArea } from "components/shared/search/search-area";
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";

const AssignCitizenToTowOrTaxiCall = dynamic(
  async () =>
    (await import("components/citizen/tow/assign-to-tow-taxi-call")).AssignCitizenToTowOrTaxiCall,
);
const ManageCallModal = dynamic(
  async () => (await import("components/citizen/tow/manage-tow-call")).ManageCallModal,
);

interface Props {
  initialData: GetTaxiCallsData | GetTowCallsData;
  type: "tow" | "taxi";
  noCallsText: string;
}

export function TowTaxiCallsTable({ initialData, type, noCallsText }: Props) {
  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    totalCount: initialData.totalCount,
    initialData: initialData.calls,
    search,
    fetchOptions: {
      path: type === "taxi" ? "/taxi" : "/tow",
      onResponse(json: GetTaxiCallsData | GetTowCallsData) {
        return { data: json.calls, totalCount: json.totalCount };
      },
    },
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempCall, callState] = useTemporaryItem<string, TowCall | TaxiCall>(asyncTable.items);

  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");

  const CreateCallEvent = type === "tow" ? SocketEvents.CreateTowCall : SocketEvents.CreateTaxiCall;
  const EndCallEvent = type === "tow" ? SocketEvents.EndTowCall : SocketEvents.EndTaxiCall;
  const UpdateCallEvent = type === "tow" ? SocketEvents.UpdateTowCall : SocketEvents.UpdateTaxiCall;

  const { hasPermissions } = usePermission();
  const toCheckPerms =
    type === "tow" ? [Permissions.ManageTowCalls] : [Permissions.ManageTaxiCalls];
  const hasManagePermissions = hasPermissions(toCheckPerms);

  function assignClick(call: TowCall | TaxiCall) {
    modalState.openModal(ModalIds.AssignToTowCall);
    callState.setTempId(call.id);
  }

  function editClick(call: TowCall | TaxiCall) {
    modalState.openModal(ModalIds.ManageTowCall);
    callState.setTempId(call.id);
  }

  function updateCalls(updatedCall: TowCall | TaxiCall) {
    callState.setTempId(null);
    asyncTable.update(updatedCall.id, updatedCall);
  }

  function handleCallEnd(call: TowCall | TaxiCall) {
    asyncTable.remove(call.id);
  }

  function handleCallCreation(call: TowCall | TaxiCall) {
    const isAlreadyInCalls = asyncTable.items.some((v) => v.id === call.id);

    if (!isAlreadyInCalls) {
      asyncTable.prepend(call);
    }
  }

  useListener(EndCallEvent, handleCallEnd);
  useListener({ eventName: UpdateCallEvent, checkHasListeners: true }, updateCalls, [asyncTable]);
  useListener({ eventName: CreateCallEvent, checkHasListeners: true }, handleCallCreation, [
    asyncTable,
  ]);

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
      <SearchArea
        asyncTable={asyncTable}
        search={{ setSearch, search }}
        totalCount={initialData.totalCount}
      />

      {asyncTable.items.length <= 0 ? (
        <p className="mt-5">{noCallsText}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((call) => ({
            id: call.id,
            location: call.location,
            postal: call.postal || common("none"),
            description: <CallDescription nonCard data={call} />,
            caller: call.creator
              ? `${call.creator.name} ${call.creator.surname}`
              : (call.name ?? leo("dispatch")),
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

      <AssignCitizenToTowOrTaxiCall
        onClose={() => callState.setTempId(null)}
        onSuccess={updateCalls}
        call={tempCall}
      />
      <ManageCallModal
        onClose={() => callState.setTempId(null)}
        onDelete={handleCallEnd}
        call={tempCall}
      />
    </>
  );
}
