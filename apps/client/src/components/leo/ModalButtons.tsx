import { Button } from "@snailycad/ui";
import { type ActiveOfficer, useLeoState } from "state/leo-state";
import { ActiveToneType, ShouldDoType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { makeUnitName } from "lib/utils";
import { isUnitCombined, isUnitOfficer } from "@snailycad/utils";
import * as modalButtons from "components/modal-buttons/buttons";
import { ModalButton } from "components/modal-buttons/modal-button";
import type { PostLeoTogglePanicButtonData } from "@snailycad/types/api";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import { useMounted } from "@casperiv/useful";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import dynamic from "next/dynamic";
import { ImageWrapper } from "components/shared/image-wrapper";
import { ActiveCallColumn } from "components/dispatch/active-units/officers/columns/active-call-column";
import { ActiveIncidentColumn } from "components/dispatch/active-units/officers/columns/active-incident-column";
import { PrivateMessagesButton } from "./private-messages/private-messages-button";
import { PrivateMessagesModal } from "components/dispatch/active-units/private-messages/private-messages-modal";

const TonesModal = dynamic(
  async () => (await import("components/dispatch/modals/tones-modal")).TonesModal,
  { ssr: false },
);

const buttons: modalButtons.ModalButton[] = [
  modalButtons.switchDivision,
  modalButtons.nameSearchBtn,
  modalButtons.plateSearchBtn,
  modalButtons.weaponSearchBtn,
  modalButtons.businessSearchBtn,
  modalButtons.customFieldSearchBtn,
  modalButtons.create911CallBtn,
  modalButtons.createWrittenWarningBtn,
  modalButtons.createTicketBtn,
  modalButtons.createArrestReportBtn,
  modalButtons.createWarrantBtn,
  modalButtons.createBoloBtn,
  modalButtons.notepadBtn,
  modalButtons.departmentInformationBtn,
];

export function ModalButtons({ initialActiveOfficer }: { initialActiveOfficer: ActiveOfficer }) {
  const _activeOfficer = useLeoState((s) => s.activeOfficer);
  const isMounted = useMounted();
  const activeOfficer = isMounted ? _activeOfficer : initialActiveOfficer;
  const { hasPermissions } = usePermission();

  const isAdmin = hasPermissions(defaultPermissions.allDefaultAdminPermissions);

  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const { state: activeDispatchersState, hasActiveDispatchers } = useActiveDispatchers();
  const { state, execute } = useFetch();
  const modalState = useModal();
  const { TONES, PANIC_BUTTON } = useFeatureEnabled();
  const { makeImageUrl } = useImageUrl();

  async function handlePanic() {
    if (!activeOfficer) return;

    await execute<PostLeoTogglePanicButtonData>({
      path: "/leo/panic-button",
      method: "POST",
      data: { officerId: activeOfficer.id },
    });
  }

  const isButtonDisabled = isAdmin
    ? false
    : !activeOfficer ||
      activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY ||
      activeOfficer.statusId === null;

  const nameAndCallsign =
    activeOfficer &&
    !isButtonDisabled &&
    (isUnitCombined(activeOfficer)
      ? generateCallsign(activeOfficer, "pairedUnitTemplate")
      : `${generateCallsign(activeOfficer)} ${makeUnitName(activeOfficer)}`);

  return (
    <div className="py-2">
      {nameAndCallsign && activeOfficer ? (
        <div className="flex items-center gap-x-12">
          <p>
            <span className="font-semibold">{t("Leo.activeOfficer")}: </span>

            {isUnitOfficer(activeOfficer) && activeOfficer.imageId ? (
              <ImageWrapper
                quality={70}
                className="rounded-md w-[30px] h-[30px] object-cover mx-2 inline"
                draggable={false}
                src={makeImageUrl("units", activeOfficer.imageId)!}
                loading="lazy"
                width={30}
                height={30}
                alt={String(nameAndCallsign)}
              />
            ) : null}
            {nameAndCallsign}
          </p>

          <p className="flex items-center gap-x-1">
            <span className="font-semibold">{t("Leo.activeCall")}: </span>
            <ActiveCallColumn
              size="sm"
              callId={activeOfficer.activeCallId}
              isDispatch={false}
              unitId={activeOfficer.id}
            />
          </p>

          <p className="flex items-center gap-x-1">
            <span className="font-semibold">{t("Leo.incident")}: </span>
            <ActiveIncidentColumn
              size="sm"
              incidentId={activeOfficer.activeIncidentId}
              isDispatch={false}
              unitId={activeOfficer.id}
            />
          </p>

          <p className="flex items-center gap-x-1">
            <span className="font-semibold">{t("Leo.privateMessages")}: </span>
            <PrivateMessagesButton unit={activeOfficer} />
          </p>

          <PrivateMessagesModal />
        </div>
      ) : null}

      <div className="mt-3 modal-buttons-grid">
        {buttons.map((button, idx) => {
          return (
            <ModalButton
              disabled={isButtonDisabled}
              title={isButtonDisabled ? "Go on-duty before continuing" : undefined}
              key={idx}
              button={button}
              unit={activeOfficer}
            />
          );
        })}

        {PANIC_BUTTON ? (
          <Button
            id="panicButton"
            disabled={state === "loading" || isButtonDisabled}
            title={isButtonDisabled ? "Go on-duty before continuing" : t("Leo.panicButton")}
            onPress={handlePanic}
          >
            {t("Leo.panicButton")}
          </Button>
        ) : null}

        {activeDispatchersState === "loading" ? null : !hasActiveDispatchers && TONES ? (
          <>
            <Button
              disabled={isButtonDisabled}
              onPress={() => modalState.openModal(ModalIds.Tones)}
            >
              {t("Leo.tones")}
            </Button>
            <TonesModal types={[ActiveToneType.LEO]} />
          </>
        ) : null}
      </div>
    </div>
  );
}
