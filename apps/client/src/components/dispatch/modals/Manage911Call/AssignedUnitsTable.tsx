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
import { SituationChangeColumn } from "./situation-change-column";
import { useValues } from "context/ValuesContext";

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
              unit: (
                <SituationChangeColumn isDisabled={isDisabled} unit={unit}>
                  {callsignAndName}
                </SituationChangeColumn>
              ),
              status: <StatusColumn isDisabled={isDisabled} unit={unit} />,
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

interface StatusColumnProps extends RoleColumnProps {
  color?: string;
  useDot?: boolean;
}

function StatusColumn({ unit, isDisabled, color, useDot }: StatusColumnProps) {
  const { currentlySelectedCall } = useCall911State();
  const [selectedKey, setSelectedKey] = React.useState(unit.unit?.statusId ?? null);
  const { execute } = useFetch();
  const t = useTranslations("Calls");
  const { codes10 } = useValues();

  React.useEffect(() => {
    setSelectedKey(unit.unit?.statusId ?? null);
  }, [unit]);

  async function handleUpdateStatus(value: string) {
    if (!currentlySelectedCall || !unit.unit?.id) return;

    const { json, error } = await execute<PUT911CallAssignedUnit>({
      path: `/dispatch/status/${unit.unit.id}`,
      method: "PUT",
      data: { status: value },
    });

    if (!error && json.id) {
      setSelectedKey(value);
    }
  }

  if (isDisabled) {
    return (
      <span className="flex items-center">
        {useDot && color ? (
          <span style={{ background: color }} className="block w-3 h-3 mr-2 rounded-full" />
        ) : null}
        {unit.unit?.status?.value?.value}
      </span>
    );
  }

  return (
    <SelectField
      label={t("primaryUnit")}
      hiddenLabel
      selectedKey={selectedKey}
      onSelectionChange={(key) => handleUpdateStatus(key as string)}
      options={codes10.values
        .filter((v) => v.type === "STATUS_CODE")
        .map((value) => ({
          label: value.value.value,
          value: value.id,
        }))}
    />
  );
}
