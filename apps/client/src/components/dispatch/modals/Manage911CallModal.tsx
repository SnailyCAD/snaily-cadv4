import * as React from "react";
import { useTranslations } from "use-intl";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import useFetch from "lib/useFetch";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { useRouter } from "next/router";
import { AlertModal } from "components/modal/AlertModal";
import { CallEventsArea } from "../events/EventsArea";

import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { useLeoState } from "state/leo-state";
import { useEmsFdState } from "state/ems-fd-state";
import type { Delete911CallByIdData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import { Manage911CallForm } from "./Manage911Call/Manage911CallForm";
import { Infofield } from "components/shared/Infofield";
import { FullDate } from "components/shared/FullDate";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { shallow } from "zustand/shallow";
import { isUnitCombined } from "@snailycad/utils";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useInvalidateQuery } from "hooks/use-invalidate-query";

interface Props {
  call: Full911Call | null;
  forceOpen?: boolean;
  forceDisabled?: boolean;
  setCall?(call: Full911Call | null): void;
  onClose?(): void;
}

export function Manage911CallModal({ setCall, forceDisabled, forceOpen, call, onClose }: Props) {
  const [showAlert, setShowAlert] = React.useState(false);

  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Calls");
  const { state, execute } = useFetch();
  const { setCalls, calls } = useCall911State(
    (state) => ({
      setCalls: state.setCalls,
      calls: state.calls,
    }),
    shallow,
  );

  const router = useRouter();
  const { hasPermissions } = usePermission();
  const { generateCallsign } = useGenerateCallsign();

  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const activeDeputy = useEmsFdState((state) => state.activeDeputy);
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { invalidateQuery } = useInvalidateQuery(["/911-calls"]);

  const hasDispatchPermissions = hasPermissions(
    defaultPermissions.defaultDispatchPermissions,
    (u) => u.isDispatch,
  );

  const activeUnit = router.pathname.includes("/officer") ? activeOfficer : activeDeputy;
  const isDispatch = router.pathname.includes("/dispatch") && hasDispatchPermissions;

  const isDisabled = forceDisabled
    ? true
    : isDispatch
    ? false
    : call
    ? !call?.assignedUnits.some((u) => u.unit?.id === activeUnit?.id) && hasActiveDispatchers
    : false;

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
    closeModal(ModalIds.Manage911Call);
  }

  async function handleDelete() {
    if (!call || isDisabled) return;

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
      isOpen={forceOpen ?? isOpen(ModalIds.Manage911Call)}
      onClose={handleClose}
      title={call ? t("manage911Call") : t("create911Call")}
      className={call ? "!max-w-[100rem] w-full" : "w-[650px]"}
    >
      {/* todo: custom component for expanded view */}
      {call ? (
        <div className="mb-4 flex flex-wrap flex-row gap-4 max-w-[1050px]">
          <Infofield label={t("call")}>#{call?.caseNumber}</Infofield>
          <Infofield label={t("lastUpdatedAt")}>
            <FullDate>{call?.updatedAt}</FullDate>
          </Infofield>
          {primaryUnit ? <Infofield label={t("primaryUnit")}>{primaryUnit}</Infofield> : null}
          {call.type ? <Infofield label={t("type")}>{call?.type.value.value}</Infofield> : null}
          {call.type?.priority ? (
            <Infofield label={t("priority")}>{call?.type.priority}</Infofield>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row">
        <Manage911CallForm
          setShowAlert={setShowAlert}
          handleClose={handleClose}
          isDisabled={isDisabled}
          call={call}
        />

        {call ? (
          <CallEventsArea
            handleStateUpdate={handleCallStateUpdate}
            disabled={isDisabled}
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
