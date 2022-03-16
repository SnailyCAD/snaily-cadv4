import * as React from "react";
import type { TaxiCall, TowCall } from "@snailycad/types";
import { Button } from "components/Button";
import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";

const AssignToCallModal = dynamic(
  async () => (await import("components/citizen/tow/AssignToTowCall")).AssignToCallModal,
);
const ManageCallModal = dynamic(
  async () => (await import("components/citizen/tow/ManageTowCall")).ManageCallModal,
);

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

interface Props {
  noCallsText: string;
  calls: (TowCall | TaxiCall)[];
  setCalls: React.Dispatch<React.SetStateAction<(TowCall | TaxiCall)[]>>;
}

export function TowTaxiCallsTable({ calls, noCallsText, setCalls }: Props) {
  const [tempCall, setTempCall] = React.useState<TowCall | TaxiCall | null>(null);
  const { openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");

  function handleViewDescription(call: TowCall | TaxiCall) {
    setTempCall(call);
    openModal(ModalIds.Description, call);
  }

  function assignClick(call: TowCall | TaxiCall) {
    openModal(ModalIds.AssignToTowCall);
    setTempCall(call);
  }

  function editClick(call: TowCall | TaxiCall) {
    openModal(ModalIds.ManageTowCall);
    setTempCall(call);
  }

  function updateCalls(old: TowCall | TaxiCall, newC: TowCall | TaxiCall) {
    setTempCall(null);
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
      <span>
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
          defaultSort={{
            descending: true,
            columnId: "createdAt",
          }}
          data={calls.map((call) => ({
            location: call.location,
            postal: call.postal || common("none"),
            description:
              call.description && !call.descriptionData ? (
                call.description
              ) : (
                <Button small onClick={() => handleViewDescription(call)}>
                  {common("viewDescription")}
                </Button>
              ),
            caller: call.creator
              ? `${call.creator.name} ${call.creator.surname}`
              : call.name ?? leo("dispatch"),
            assignedUnit: assignedUnit(call),
            createdAt: <FullDate>{call.createdAt}</FullDate>,
            actions: (
              <>
                <Button onClick={() => editClick(call)} small variant="success">
                  {common("edit")}
                </Button>
                <Button className="ml-2" onClick={() => assignClick(call)} small>
                  {t("assignToCall")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: t("location"), accessor: "location" },
            { Header: t("postal"), accessor: "postal" },
            { Header: common("description"), accessor: "description" },
            { Header: t("caller"), accessor: "caller" },
            { Header: t("assignedUnit"), accessor: "assignedUnit" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <AssignToCallModal
        onClose={() => setTempCall(null)}
        onSuccess={updateCalls}
        call={tempCall}
      />
      <ManageCallModal
        onClose={() => setTempCall(null)}
        onDelete={handleCallEnd}
        onUpdate={updateCalls}
        call={tempCall}
      />
      {tempCall?.descriptionData ? (
        <DescriptionModal onClose={() => setTempCall(null)} value={tempCall.descriptionData} />
      ) : null}
    </>
  );
}
