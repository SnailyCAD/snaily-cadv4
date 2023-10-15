import { Button } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useModal } from "state/modalState";
import { usePermission } from "hooks/usePermission";
import { useRouter } from "next/router";
import { defaultPermissions } from "@snailycad/permissions";
import type { ActiveOfficer } from "state/leo-state";
import type { ActiveDeputy } from "state/ems-fd-state";
import { type LeoIncident, ShouldDoType } from "@snailycad/types";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "next-intl";

interface Props {
  incident: LeoIncident;
  unit: ActiveOfficer | ActiveDeputy | null;
  isUnitAssigned: boolean;
  setTempIncident(incident: LeoIncident): void;
  handleAssignUnassignToIncident(
    incident: LeoIncident,
    unitId: string,
    type: "assign" | "unassign",
  ): void;
}

export function ActiveIncidentsActionsColumn({
  setTempIncident,
  handleAssignUnassignToIncident,
  isUnitAssigned,
  unit,
  incident,
}: Props) {
  const modalState = useModal();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { hasPermissions } = usePermission();
  const router = useRouter();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  const hasDispatchPermissions = hasPermissions(defaultPermissions.defaultDispatchPermissions);
  const isDispatch = router.pathname === "/dispatch" && hasDispatchPermissions;

  const isUnitActive = unit?.status && unit.status.shouldDo !== ShouldDoType.SET_OFF_DUTY;

  function onEditClick(incident: LeoIncident) {
    modalState.openModal(ModalIds.ManageIncident);
    setTempIncident(incident);
  }

  function onEndClick(incident: LeoIncident) {
    modalState.openModal(ModalIds.AlertDeleteIncident);
    setTempIncident(incident);
  }

  return (
    <>
      <Button
        isDisabled={isDispatch ? !hasActiveDispatchers : !isUnitActive}
        size="xs"
        variant="success"
        onPress={() => onEditClick(incident)}
      >
        {isDispatch ? common("manage") : common("view")}
      </Button>

      {isDispatch ? (
        <Button
          onPress={() => onEndClick(incident)}
          isDisabled={!hasActiveDispatchers}
          size="xs"
          variant="danger"
          className="ml-2"
        >
          {t("end")}
        </Button>
      ) : (
        <Button
          className="ml-2"
          isDisabled={!isUnitActive}
          size="xs"
          onPress={() =>
            unit &&
            handleAssignUnassignToIncident(
              incident,
              unit.id,
              isUnitAssigned ? "unassign" : "assign",
            )
          }
        >
          {isUnitAssigned ? t("unassignFromIncident") : t("assignToIncident")}
        </Button>
      )}
    </>
  );
}
