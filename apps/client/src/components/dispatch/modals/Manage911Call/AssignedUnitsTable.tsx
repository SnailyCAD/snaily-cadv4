import * as React from "react";
import { Table, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import type { Full911Call } from "state/dispatch/dispatch-state";
import useFetch from "lib/useFetch";
import { useCall911State } from "state/dispatch/call-911-state";
import type { Post911CallAssignUnAssign, PUT911CallAssignedUnit } from "@snailycad/types/api";
import { useAuth } from "context/AuthContext";
import { AssignedUnit, StatusViewMode } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { Button, Loader, SelectField } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AddUnitToCallModal } from "./add-unit-to-call-modal";
import { FullDate } from "components/shared/FullDate";
import { generateContrastColor } from "lib/table/get-contrasting-text-color";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";

interface Props {
  isDisabled: boolean;
}

export function AssignedUnitsTable({ isDisabled }: Props) {
  const call911State = useCall911State();
  const call = call911State.currentlySelectedCall!;
  const assignedUnits = call.assignedUnits ?? [];
  const { generateCallsign } = useGenerateCallsign();
  const tableState = useTableState();
  const { user } = useAuth();
  const t = useTranslations("Calls");
  const { openModal } = useModal();
  const { state, execute } = useFetch();

  async function handleUnassignFromCall(unit: AssignedUnit) {
    const { json } = await execute<Post911CallAssignUnAssign>({
      path: `/911-calls/unassign/${call.id}`,
      method: "POST",
      data: {
        unit: unit.officerId || unit.emsFdDeputyId || unit.combinedLeoId || unit.combinedEmsFdId,
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
    <div className="mt-4">
      <header className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold text-2xl">{t("assignedUnits")}</h2>

        {isDisabled ? null : (
          <Button size="xs" type="button" onPress={() => openModal(ModalIds.AddAssignedUnit)}>
            {t("addUnit")}
          </Button>
        )}
      </header>

      <div className="max-h-[35rem] overflow-y-auto">
        <Table
          features={{ isWithinCardOrModal: true }}
          tableState={tableState}
          data={assignedUnits.map((unit) => {
            const templateId =
              unit.unit && (isUnitCombined(unit.unit) || isUnitCombinedEmsFd(unit.unit))
                ? "pairedUnitTemplate"
                : "callsignTemplate";
            const callsignAndName =
              unit.unit && `${generateCallsign(unit.unit, templateId)} ${makeUnitName(unit.unit)}`;

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
                  {unit.unit?.status?.value?.value}
                </span>
              ),
              role: <RoleColumn isDisabled={isDisabled} unit={unit} />,
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
            { header: "Role", accessorKey: "role" },
            { header: "Updated at", accessorKey: "updatedAt" },
            isDisabled ? null : { header: "Actions", accessorKey: "actions" },
          ]}
        />
      </div>

      {isDisabled ? null : <AddUnitToCallModal />}
    </div>
  );
}

interface RoleColumnProps {
  unit: Full911Call["assignedUnits"][number];
  isDisabled: boolean;
}

function RoleColumn({ unit, isDisabled }: RoleColumnProps) {
  const { currentlySelectedCall, calls, setCalls, setCurrentlySelectedCall } = useCall911State();
  const [isPrimary, setIsPrimary] = React.useState(String(unit.isPrimary ?? "false"));
  const { execute } = useFetch();
  const t = useTranslations("Calls");

  React.useEffect(() => {
    setIsPrimary(String(unit.isPrimary ?? "false"));
  }, [unit]);

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

  if (isDisabled) {
    return <p>{isPrimary === "true" ? "Primary" : "None"}</p>;
  }

  return (
    <SelectField
      label={t("primaryUnit")}
      hiddenLabel
      selectedKey={isPrimary}
      onSelectionChange={(key) => handleUpdatePrimary(key as string)}
      options={[
        { label: "Primary", value: "true" },
        { label: "None", value: "false" },
      ]}
    />
  );
}
