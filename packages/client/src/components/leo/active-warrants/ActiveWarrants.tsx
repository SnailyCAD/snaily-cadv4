import * as React from "react";
import type { AssignedWarrantOfficer, Warrant } from "@snailycad/types";
import { Button } from "components/Button";
import { Table, useTableState } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { CreateWarrantModal } from "../modals/CreateWarrantModal";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useActiveWarrants } from "hooks/realtime/useActiveWarrants";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { isUnitCombined } from "@snailycad/utils";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

export function ActiveWarrants() {
  const { activeWarrants, setActiveWarrants } = useActiveWarrants();
  const { generateCallsign } = useGenerateCallsign();
  const [tempWarrant, warrantState] = useTemporaryItem(activeWarrants);
  const t = useTranslations("Leo");
  const tableState = useTableState({
    pagination: { pageSize: 12, totalDataCount: activeWarrants.length },
  });

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
        <h1 className="text-xl font-semibold">{t("activeWarrants")}</h1>

        <div>
          <Button
            variant={null}
            className="dark:bg-gray-2 dark:hover:bg-dark-bg bg-gray-500 hover:bg-gray-600 text-white"
            onClick={() => openModal(ModalIds.CreateWarrant, { isActive: true })}
          >
            {t("createWarrant")}
          </Button>
        </div>
      </header>

      <div className="px-4">
        {activeWarrants.length <= 0 ? (
          <p className="py-2 text-neutral-700 dark:text-gray-300">{t("noActiveWarrants")}</p>
        ) : (
          <Table
            tableState={tableState}
            features={{ isWithinCard: true }}
            data={activeWarrants.filter(isActiveWarrant).map((warrant) => ({
              id: warrant.id,
              citizen: `${warrant.citizen.name} ${warrant.citizen.surname}`,
              description: <CallDescription data={{ description: warrant.description }} />,
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
              { header: "Citizen", accessorKey: "citizen" },
              { header: common("description"), accessorKey: "description" },
              { header: "assigned Officers", accessorKey: "assignedOfficers" },
              { header: common("actions"), accessorKey: "actions" },
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

          copied[idx] = warrant;
          setActiveWarrants(copied);
          warrantState.setTempId(null);
        }}
      />
    </div>
  );
}

function isActiveWarrant(warrant: Warrant): warrant is Warrant & { status: "ACTIVE" } {
  return warrant.status === "ACTIVE";
}
