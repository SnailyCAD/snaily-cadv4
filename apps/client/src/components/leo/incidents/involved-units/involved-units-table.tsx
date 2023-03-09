import { Table, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import useFetch from "lib/useFetch";
import type { PutIncidentByIdData } from "@snailycad/types/api";
import { useAuth } from "context/AuthContext";
import { EmsFdIncident, IncidentInvolvedUnit, LeoIncident, StatusViewMode } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { Button, Loader } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";
import { generateContrastColor } from "lib/table/get-contrasting-text-color";
import dynamic from "next/dynamic";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { shallow } from "zustand/shallow";

const AddInvolvedUnitToIncidentModal = dynamic(
  async () => (await import("./add-involved-unit")).AddInvolvedUnitToIncidentModal,
  { ssr: false },
);

interface Props<T extends LeoIncident | EmsFdIncident> {
  isDisabled: boolean;
  incident: T;
  type: "ems-fd" | "leo";
}

export function InvolvedUnitsTable<T extends LeoIncident | EmsFdIncident>({
  isDisabled,
  incident,
  type,
}: Props<T>) {
  const unitsInvolved = incident.unitsInvolved;
  const { generateCallsign } = useGenerateCallsign();
  const tableState = useTableState();
  const { user } = useAuth();
  const t = useTranslations("Leo");
  const { openModal } = useModal();
  const { state, execute } = useFetch();
  const { activeIncidents, setActiveIncidents } = useDispatchState(
    (state) => ({
      setActiveIncidents: state.setActiveIncidents,
      activeIncidents: state.activeIncidents,
    }),
    shallow,
  );

  async function handleUnassignFromCall(unit: IncidentInvolvedUnit) {
    const newAssignedUnits = [...incident.unitsInvolved]
      .filter((v) => v.id !== unit.id)
      .map((v) => v.officerId || v.emsFdDeputyId || v.combinedLeoId || v.combinedEmsFdId);

    const { json } = await execute<PutIncidentByIdData<T extends EmsFdIncident ? "ems-fd" : "leo">>(
      {
        path: type === "leo" ? `/incidents/${incident.id}` : `/ems-fd/incidents/${incident.id}`,
        method: "PUT",
        data: {
          ...incident,
          unitsInvolved: newAssignedUnits,
        },
      },
    );

    if (json.id) {
      setActiveIncidents(
        activeIncidents.map((_incident) => {
          if (_incident.id === incident.id) {
            return { ..._incident, ...json };
          }

          return _incident;
        }),
      );
    }
  }

  return (
    <div className="mt-7">
      <header className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold text-2xl">{t("involvedUnits")}</h2>

        {isDisabled ? null : (
          <Button size="xs" type="button" onPress={() => openModal(ModalIds.AddInvolvedUnit)}>
            {t("addUnit")}
          </Button>
        )}
      </header>

      <div className="max-h-[35rem] overflow-y-auto">
        <Table
          features={{ isWithinCardOrModal: true }}
          tableState={tableState}
          data={unitsInvolved.map((unit) => {
            const callsignAndName =
              unit.unit && `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;

            const color = unit.unit?.status?.color;
            const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;

            return {
              rowProps: {
                style: {
                  background: !useDot && color ? color : undefined,
                  color: !useDot && color ? generateContrastColor(color) : undefined,
                },
              },
              id: unit.id,
              unit: callsignAndName,
              status: (
                <span className="flex items-center">
                  {useDot && color ? (
                    <span
                      style={{ background: color }}
                      className="block w-3 h-3 mr-2 rounded-full"
                    />
                  ) : null}
                  {unit.unit?.status?.value.value}
                </span>
              ),
              updatedAt: <FullDate>{unit.updatedAt}</FullDate>,
              actions: (
                <Button
                  className="flex items-center gap-2"
                  disabled={isDisabled || state === "loading"}
                  onPress={() => handleUnassignFromCall(unit)}
                  size="xs"
                  variant="danger"
                  type="button"
                >
                  {state === "loading" ? <Loader /> : null}
                  {t("unassign")}
                </Button>
              ),
            };
          })}
          columns={[
            { header: "Unit", accessorKey: "unit" },
            { header: "Status", accessorKey: "status" },
            { header: "Updated at", accessorKey: "updatedAt" },
            isDisabled ? null : { header: "Actions", accessorKey: "actions" },
          ]}
        />
      </div>

      {isDisabled ? null : <AddInvolvedUnitToIncidentModal type={type} incident={incident} />}
    </div>
  );
}
