import { Button } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { useModal } from "state/modalState";
import { usePermission } from "hooks/usePermission";
import { useRouter } from "next/router";
import { defaultPermissions } from "@snailycad/permissions";
import type { ActiveOfficer } from "state/leo-state";
import type { ActiveDeputy } from "state/ems-fd-state";
import { ShouldDoType } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "next-intl";
import { useCall911State } from "state/dispatch/call-911-state";

interface Props {
  call: Full911Call;
  unit: ActiveOfficer | ActiveDeputy | null;
  isUnitAssigned: boolean;

  handleAssignUnassignToCall(call: Full911Call, type: "assign" | "unassign"): void;
}

export function ActiveCallsActionsColumn({
  isUnitAssigned,
  unit,
  call,
  handleAssignUnassignToCall,
}: Props) {
  const { openModal } = useModal();
  const { TOW } = useFeatureEnabled();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { hasPermissions } = usePermission();
  const router = useRouter();
  const { setCurrentlySelectedCall } = useCall911State((s) => ({
    setCurrentlySelectedCall: s.setCurrentlySelectedCall,
  }));

  const t = useTranslations("Calls");
  const common = useTranslations("Common");

  const hasDispatchPermissions = hasPermissions(
    defaultPermissions.defaultDispatchPermissions,
    (u) => u.isDispatch,
  );
  const isDispatch = router.pathname === "/dispatch" && hasDispatchPermissions;

  const isUnitActive = unit?.status && unit.status.shouldDo !== ShouldDoType.SET_OFF_DUTY;

  function handleManageClick(call: Full911Call) {
    setCurrentlySelectedCall(call);
    openModal(ModalIds.Manage911Call, call);
  }

  function handleCallTow(call: Full911Call) {
    if (!TOW) return;
    setCurrentlySelectedCall(call);
    openModal(ModalIds.ManageTowCall, { call911Id: call.id });
  }

  return (
    <>
      <Button
        disabled={isDispatch ? !hasActiveDispatchers : !isUnitActive}
        size="xs"
        variant="success"
        onPress={() => handleManageClick(call)}
      >
        {isDispatch ? common("manage") : common("view")}
      </Button>

      {isDispatch ? null : isUnitAssigned ? (
        <Button
          className="ml-2"
          disabled={!isUnitActive}
          size="xs"
          onPress={() => handleAssignUnassignToCall(call, "unassign")}
        >
          {t("unassignFromCall")}
        </Button>
      ) : (
        <Button
          className="ml-2"
          disabled={!isUnitActive}
          size="xs"
          onPress={() => handleAssignUnassignToCall(call, "assign")}
        >
          {t("assignToCall")}
        </Button>
      )}

      {TOW ? (
        <Button
          disabled={isDispatch ? !hasActiveDispatchers : !isUnitActive}
          size="xs"
          className="ml-2"
          onPress={() => handleCallTow(call)}
        >
          {t("callTow")}
        </Button>
      ) : null}
    </>
  );
}
