import { Button } from "@snailycad/ui";
import { ModalIds } from "types/modal-ids";
import { ActiveToneType, ShouldDoType } from "@snailycad/types";
import { useModal } from "state/modalState";
import { useTranslations } from "use-intl";
import { type ActiveDeputy, useEmsFdState } from "state/ems-fd-state";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import useFetch from "lib/useFetch";
import type { PostEmsFdTogglePanicButtonData } from "@snailycad/types/api";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useMounted } from "@casperiv/useful";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { useValues } from "context/ValuesContext";
import { isUnitCombinedEmsFd } from "@snailycad/utils";

import dynamic from "next/dynamic";
import { ActiveCallColumn } from "components/dispatch/active-units/officers/columns/active-call-column";
import { ActiveIncidentColumn } from "components/dispatch/active-units/officers/columns/active-incident-column";
import { PrivateMessagesButton } from "components/leo/private-messages/private-messages-button";
import { PrivateMessagesModal } from "components/dispatch/active-units/private-messages/private-messages-modal";

const TonesModal = dynamic(
  async () => (await import("components/dispatch/modals/tones-modal")).TonesModal,
  { ssr: false },
);

interface MButton {
  nameKey: [string, string];
  modalId: ModalIds;
}

const buttons: MButton[] = [
  {
    nameKey: ["Ems", "searchMedicalRecord"],
    modalId: ModalIds.SearchMedicalRecord,
  },
  {
    nameKey: ["Ems", "createMedicalRecord"],
    modalId: ModalIds.CreateMedicalRecord,
  },
  {
    nameKey: ["Ems", "createDoctorVisit"],
    modalId: ModalIds.CreateDoctorVisit,
  },
  {
    nameKey: ["Leo", "notepad"],
    modalId: ModalIds.Notepad,
  },
  {
    nameKey: ["Leo", "departmentInformation"],
    modalId: ModalIds.DepartmentInfo,
  },
];

export function ModalButtons({
  initialActiveDeputy,
}: {
  initialActiveDeputy: ActiveDeputy | null;
}) {
  const _activeDeputy = useEmsFdState((s) => s.activeDeputy);
  const isMounted = useMounted();
  const modalState = useModal();
  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const { execute } = useFetch();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { PANIC_BUTTON, TONES } = useFeatureEnabled();
  const activeDeputy = isMounted ? _activeDeputy : initialActiveDeputy;

  const { codes10 } = useValues();
  const panicButtonCode = codes10.values.find(
    (code) => code.shouldDo === ShouldDoType.PANIC_BUTTON,
  );

  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(defaultPermissions.allDefaultAdminPermissions);

  const isButtonDisabled = isAdmin
    ? false
    : !activeDeputy ||
      activeDeputy.status?.shouldDo === ShouldDoType.SET_OFF_DUTY ||
      activeDeputy.statusId === null;

  const nameAndCallsign =
    activeDeputy &&
    !isButtonDisabled &&
    (isUnitCombinedEmsFd(activeDeputy)
      ? generateCallsign(activeDeputy, "pairedUnitTemplate")
      : `${generateCallsign(activeDeputy)} ${makeUnitName(activeDeputy)}`);

  async function handlePanic() {
    if (!activeDeputy) return;

    await execute<PostEmsFdTogglePanicButtonData>({
      path: "/ems-fd/panic-button",
      method: "POST",
      data: { deputyId: activeDeputy.id },
    });
  }

  return (
    <div className="py-2">
      {nameAndCallsign && activeDeputy ? (
        <div className="flex items-center gap-x-12">
          <p>
            <span className="font-semibold">{t("Ems.activeDeputy")}: </span>
            {nameAndCallsign}
          </p>

          <p className="flex items-center gap-x-1">
            <span className="font-semibold">{t("Leo.activeCall")}: </span>
            <ActiveCallColumn
              size="sm"
              callId={activeDeputy.activeCallId}
              isDispatch={false}
              unitId={activeDeputy.id}
            />
          </p>

          <p className="flex items-center gap-x-1">
            <span className="font-semibold">{t("Leo.incident")}: </span>
            <ActiveIncidentColumn
              size="sm"
              incidentId={activeDeputy.activeIncidentId}
              isDispatch={false}
              unitId={activeDeputy.id}
            />
          </p>

          <p className="flex items-center gap-x-1">
            <span className="font-semibold">{t("Leo.privateMessages")}: </span>
            <PrivateMessagesButton unit={activeDeputy} />
          </p>

          <PrivateMessagesModal />
        </div>
      ) : null}

      <div className="mt-2 modal-buttons-grid">
        {buttons.map((button, idx) => (
          <Button
            id={button.nameKey[1]}
            key={idx}
            disabled={isButtonDisabled}
            title={isButtonDisabled ? "Go on-duty before continuing" : button.nameKey[1]}
            onPress={() => modalState.openModal(button.modalId)}
          >
            {t(button.nameKey.join("."))}
          </Button>
        ))}

        {PANIC_BUTTON && panicButtonCode ? (
          <Button
            id="panicButton"
            disabled={isButtonDisabled}
            title={isButtonDisabled ? "Go on-duty before continuing" : t("Leo.panicButton")}
            onPress={handlePanic}
          >
            {t("Leo.panicButton")}
          </Button>
        ) : null}

        {!hasActiveDispatchers && TONES ? (
          <>
            <Button
              disabled={isButtonDisabled}
              onPress={() => modalState.openModal(ModalIds.Tones)}
            >
              {t("Leo.tones")}
            </Button>

            <TonesModal types={[ActiveToneType.EMS_FD]} />
          </>
        ) : null}
      </div>
    </div>
  );
}
