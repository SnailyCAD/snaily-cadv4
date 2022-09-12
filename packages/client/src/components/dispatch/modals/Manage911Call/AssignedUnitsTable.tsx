import * as React from "react";
import { Select } from "components/form/Select";
import { Table, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import type { Full911Call } from "state/dispatch/dispatchState";
import useFetch from "lib/useFetch";
import { useCall911State } from "state/dispatch/call911State";
import type { PUT911CallAssignedUnit } from "@snailycad/types/api";
import { useAuth } from "context/AuthContext";
import { AssignedUnit, StatusViewMode } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { Button } from "components/Button";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AddUnitToCallModal } from "./AddUnitToCallModal";
import { Loader } from "components/Loader";
import { FullDate } from "components/shared/FullDate";

interface Props {
  call: Full911Call;
}

export function AssignedUnitsTable({ call }: Props) {
  const assignedUnits = call.assignedUnits ?? [];
  const { generateCallsign } = useGenerateCallsign();
  const tableState = useTableState();
  const { user } = useAuth();
  const t = useTranslations("Calls");
  const { openModal } = useModal();
  const { state, execute } = useFetch();
  const call911State = useCall911State();

  async function handleUnassignFromCall(unit: AssignedUnit) {
    const newAssignedUnits = [...call.assignedUnits]
      .filter((v) => v.id !== unit.id)
      .map((v) => ({
        id: v.officerId || v.emsFdDeputyId || v.combinedLeoId,
        isPrimary: v.isPrimary,
      }));

    const { json } = await execute<PUT911CallAssignedUnit>({
      path: `/911-calls/${call.id}`,
      method: "PUT",
      data: {
        ...call,
        situationCode: call.situationCodeId,
        type: call.typeId,
        events: undefined,
        divisions: undefined,
        departments: undefined,
        assignedUnits: newAssignedUnits,
      },
    });

    if (json.id) {
      call911State.setCurrentlySelectedCall({ ...call, ...json });
      call911State.setCalls(
        call911State.calls.map((_call) => {
          if (_call.id === call.id) {
            return { ..._call, ...json };
          }

          return _call;
        }),
      );
    }
  }

  return (
    <div className="mt-4 max-h-[40rem]">
      <header className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold text-2xl">{t("assignedUnits")}</h2>

        <Button size="xs" type="button" onClick={() => openModal(ModalIds.AddAssignedUnit)}>
          {t("addUnit")}
        </Button>
      </header>

      <Table
        features={{ isWithinCard: true }}
        tableState={tableState}
        data={assignedUnits.map((unit) => {
          const callsignAndName =
            unit.unit && `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;

          const color = unit.unit?.status?.color;
          const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;

          return {
            rowProps: { style: { background: !useDot ? color ?? undefined : undefined } },
            id: unit.id,
            unit: callsignAndName,
            status: (
              <span className="flex items-center">
                {useDot && color ? (
                  <span style={{ background: color }} className="block w-3 h-3 mr-2 rounded-full" />
                ) : null}
                {unit.unit?.status?.value?.value}
              </span>
            ),
            role: <RoleColumn unit={unit} />,
            updatedAt: <FullDate>{unit.updatedAt}</FullDate>,
            actions: (
              <Button
                className="flex items-center gap-2"
                disabled={state === "loading"}
                onClick={() => handleUnassignFromCall(unit)}
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
          { header: "Role", accessorKey: "role" },
          { header: "Updated at", accessorKey: "updatedAt" },
          { header: "Actions", accessorKey: "actions" },
        ]}
      />

      <AddUnitToCallModal call={call} />
    </div>
  );
}

interface RoleColumnProps {
  unit: Full911Call["assignedUnits"][number];
}

function RoleColumn({ unit }: RoleColumnProps) {
  const { currentlySelectedCall, calls, setCalls, setCurrentlySelectedCall } = useCall911State();
  const [isPrimary, setIsPrimary] = React.useState(String(unit.isPrimary ?? "false"));
  const { execute } = useFetch();

  React.useEffect(() => {
    setIsPrimary(String(unit.isPrimary ?? "false"));
  }, [unit.isPrimary]);

  console.log({ isPrimary: unit.isPrimary });

  async function handleUpdatePrimary(value: string) {
    if (!currentlySelectedCall) return;

    const { json, error } = await execute<PUT911CallAssignedUnit>({
      path: `/911-calls/${currentlySelectedCall.id}/assigned-units/${unit.id}`,
      method: "PUT",
      data: { isPrimary: value === "true" },
    });

    if (!error && json.id) {
      setCurrentlySelectedCall(json);
      setCalls(
        calls.map((call) => {
          if (call.id === currentlySelectedCall.id) {
            return { ...call, ...json };
          }

          return call;
        }),
      );
      setIsPrimary(value);
    }
  }

  return (
    <Select
      value={isPrimary}
      onChange={(event) => handleUpdatePrimary(event.target.value)}
      values={[
        { label: "Primary", value: "true" },
        { label: "None", value: "false" },
      ]}
    />
  );
}
