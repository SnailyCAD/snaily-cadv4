import * as React from "react";
import { useTranslations } from "use-intl";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import useFetch from "lib/useFetch";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { useRouter } from "next/router";
import { AlertModal } from "components/modal/AlertModal";
import { CallEventsArea } from "../../events/EventsArea";

import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { type ActiveOfficer, useLeoState } from "state/leo-state";
import { type ActiveDeputy, useEmsFdState } from "state/ems-fd-state";
import type { Delete911CallByIdData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import { Manage911CallForm } from "./manage-911-call-form";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { isUnitCombined } from "@snailycad/utils";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useInvalidateQuery } from "hooks/use-invalidate-query";
import { useAuth } from "context/AuthContext";
import { FullDate, Infofield } from "@snailycad/ui";

interface Props {
  call: Full911Call | null;
  forceOpen?: boolean;
  forceDisabled?: boolean;
  setCall?(call: Full911Call | null): void;
  onClose?(): void;
}

interface AreFormFieldsDisabledOptions {
  isDispatch: boolean;
  forceDisabled?: boolean;
  call: Full911Call | null;
  hasActiveDispatchers: boolean;
  activeUnit: ActiveOfficer | ActiveDeputy | null;
}

function areFormFieldsEnabled(options: AreFormFieldsDisabledOptions) {
  /** force disable the fields */
  if (options.forceDisabled) return false;
  /** dispatch can always edit the fields */
  if (options.isDispatch) return true;
  /** a new call is being created, always editable */
  if (!options.call) return true;

  /** if there are no active dispatchers, but the unit is assigned to the call, it's editable */
  if (!options.hasActiveDispatchers) {
    const isAssignedToCall = options.call.assignedUnits.some(
      (u) => u.unit?.id === options.activeUnit?.id,
    );
    return isAssignedToCall;
  }

  // todo: make this an optional feature
  /** otherwise fields are not editable, even when the unit is assigned to the call */
  return false;
}

export function Manage911CallModal({ setCall, forceDisabled, forceOpen, call, onClose }: Props) {
  const [showAlert, setShowAlert] = React.useState(false);

  const modalState = useModal();
  const t = useTranslations("Calls");
  const { state, execute } = useFetch();
  const { setCalls, calls } = useCall911State((state) => ({
    setCalls: state.setCalls,
    calls: state.calls,
  }));

  const router = useRouter();
  const { hasPermissions } = usePermission();
  const { generateCallsign } = useGenerateCallsign();

  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const activeDeputy = useEmsFdState((state) => state.activeDeputy);
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { invalidateQuery } = useInvalidateQuery(["/911-calls"]);
  const { user } = useAuth();

  const hasDispatchPermissions = hasPermissions(defaultPermissions.defaultDispatchPermissions);

  const activeUnit = router.pathname.includes("/officer") ? activeOfficer : activeDeputy;
  const isDispatch = router.pathname.includes("/dispatch") && hasDispatchPermissions;

  const areFieldsDisabled = !areFormFieldsEnabled({
    isDispatch,
    forceDisabled,
    call,
    hasActiveDispatchers,
    activeUnit,
  });

  const handleCallStateUpdate = React.useCallback(
    (call: Full911Call) => {
      setCalls(calls.map((c) => (c.id === call.id ? call : c)));
      setCall?.(call);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [call, calls],
  );

  function handleClose() {
    onClose?.();

    setShowAlert(false);
    modalState.closeModal(ModalIds.Manage911Call);
  }

  async function handleDelete() {
    if (!call || areFieldsDisabled) return;

    const { json } = await execute<Delete911CallByIdData>({
      path: `/911-calls/${call.id}`,
      method: "DELETE",
    });

    if (json) {
      handleClose();
      setCalls(calls.filter((c) => c.id !== call.id));
      await invalidateQuery();
    }
  }

  const primaryUnit = React.useMemo(() => {
    const unit = call?.assignedUnits.find((v) => v.isPrimary);
    if (!unit?.unit) return null;
    const template = isUnitCombined(unit as any) ? "pairedUnitTemplate" : "callsignTemplate";

    return `${generateCallsign(unit.unit, template)} ${makeUnitName(unit.unit)}`;
  }, [call, generateCallsign]);

  return (
    <Modal
      isOpen={forceOpen ?? modalState.isOpen(ModalIds.Manage911Call)}
      onClose={handleClose}
      title={call ? t("manage911Call") : t("create911Call")}
      className={call ? "!max-w-[100rem] w-full" : "w-[750px]"}
    >
      {/* todo: custom component for expanded view */}
      {call ? (
        <div className="mb-4 flex flex-wrap flex-row gap-4 max-w-[1050px]">
          {user?.developerMode ? <Infofield label={t("id")}>{call.id}</Infofield> : null}
          <Infofield label={t("call")}>#{call.caseNumber}</Infofield>
          <Infofield label={t("lastUpdatedAt")}>
            <FullDate>{call.updatedAt}</FullDate>
          </Infofield>
          {primaryUnit ? <Infofield label={t("primaryUnit")}>{primaryUnit}</Infofield> : null}
          {call.type ? <Infofield label={t("type")}>{call.type.value.value}</Infofield> : null}
          {call.type?.priority ? (
            <Infofield label={t("priority")}>{call.type.priority}</Infofield>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row">
        <Manage911CallForm
          setShowAlert={setShowAlert}
          handleClose={handleClose}
          isDisabled={areFieldsDisabled}
          call={call}
        />

        {call ? (
          <CallEventsArea
            handleStateUpdate={handleCallStateUpdate}
            disabled={areFieldsDisabled}
            call={call}
          />
        ) : null}
      </div>

      {call && showAlert ? (
        <AlertModal
          forceOpen
          id={ModalIds.AlertEnd911Call}
          title={t("end911Call")}
          description={t("alert_end911Call")}
          onDeleteClick={handleDelete}
          deleteText={t("endCall")}
          state={state}
          onClose={() => setShowAlert(false)}
        />
      ) : null}
    </Modal>
  );
}
