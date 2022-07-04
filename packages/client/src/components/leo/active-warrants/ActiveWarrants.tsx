import * as React from "react";
import type { AssignedWarrantOfficer, Warrant } from "@snailycad/types";
import { Button } from "components/Button";
import { Table } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { CreateWarrantModal } from "../modals/CreateWarrantModal";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useActiveWarrants } from "hooks/realtime/useActiveWarrants";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { isUnitCombined } from "@snailycad/utils";

export function ActiveWarrants() {
  const { activeWarrants, setActiveWarrants } = useActiveWarrants();
  const { generateCallsign } = useGenerateCallsign();
  const [tempWarrant, warrantState] = useTemporaryItem(activeWarrants);

  const { openModal } = useModal();
  const common = useTranslations("Common");

  function handleEditClick(warrant: Warrant) {
    warrantState.setTempId(warrant.id);
    openModal(ModalIds.CreateWarrant, { isActive: true });
  }

  function assignedOfficers(assignedOfficers: AssignedWarrantOfficer[]) {
    return assignedOfficers.map((unit) => {
      return isUnitCombined(unit.unit)
        ? generateCallsign(unit.unit, "pairedUnitTemplate")
        : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
    });
  }

  return (
    <div className="overflow-hidden rounded-md card mt-3">
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{"Active warrants"}</h3>

        <div>
          <Button onClick={() => openModal(ModalIds.CreateWarrant, { isActive: true })}>
            Create active warrant
          </Button>
        </div>
      </header>

      <div className="px-4">
        {activeWarrants.length <= 0 ? (
          <p className="py-2 text-neutral-700 dark:text-gray-300">
            {"there are no active warrants"}
          </p>
        ) : (
          <Table
            isWithinCard
            data={activeWarrants.filter(isActiveWarrant).map((warrant) => ({
              citizen: `${warrant.citizen.name} ${warrant.citizen.surname}`,
              description: warrant.description,
              assignedOfficers:
                warrant.assignedOfficers.length <= 0
                  ? common("none")
                  : assignedOfficers(warrant.assignedOfficers),
              actions: (
                <Button variant="success" onClick={() => handleEditClick(warrant)} size="xs">
                  {common("edit")}
                </Button>
              ),
            }))}
            columns={[
              { Header: "Citizen", accessor: "citizen" },
              { Header: common("description"), accessor: "description" },
              { Header: "assigned Officers", accessor: "assignedOfficers" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        )}
      </div>

      <CreateWarrantModal
        onClose={() => warrantState.setTempId(null)}
        warrant={tempWarrant}
        onCreate={(warrant) => {
          setActiveWarrants([...activeWarrants, warrant]);
        }}
        onUpdate={(previous, warrant) => {
          const copied = [...activeWarrants];
          const idx = copied.indexOf(previous);

          warrantState.setTempId(null);
          copied[idx] = warrant;
          setActiveWarrants(copied);
        }}
      />
    </div>
  );
}

function isActiveWarrant(warrant: Warrant): warrant is Warrant & { status: "ACTIVE" } {
  return warrant.status === "ACTIVE";
}
