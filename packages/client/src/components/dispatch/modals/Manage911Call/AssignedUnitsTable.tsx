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
import { StatusViewMode } from "@snailycad/types";

interface Props {
  call: Full911Call;
}

export function AssignedUnitsTable({ call }: Props) {
  const assignedUnits = call.assignedUnits ?? [];
  const { generateCallsign } = useGenerateCallsign();
  const tableState = useTableState();
  const { user } = useAuth();

  return (
    <div>
      <Table
        features={{ isWithinCard: true }}
        tableState={tableState}
        data={assignedUnits.map((unit) => {
          const callsignAndName =
            unit.unit && `${generateCallsign(unit.unit)} - ${makeUnitName(unit.unit)}`;

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
          };
        })}
        columns={[
          { header: "Unit", accessorKey: "unit" },
          { header: "Status", accessorKey: "status" },
          { header: "Role", accessorKey: "role" },
        ]}
      />
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
