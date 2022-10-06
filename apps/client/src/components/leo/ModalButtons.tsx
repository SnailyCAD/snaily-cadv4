import { Button } from "@snailycad/ui";
import { ActiveOfficer, useLeoState } from "state/leoState";
import { Rank, ShouldDoType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { makeUnitName } from "lib/utils";
import { isUnitCombined, isUnitOfficer } from "@snailycad/utils";
import * as modalButtons from "components/modal-buttons/buttons";
import { ModalButton } from "components/modal-buttons/ModalButton";
import type { PostLeoTogglePanicButtonData } from "@snailycad/types/api";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { TonesModal } from "components/dispatch/modals/TonesModal";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import Image from "next/future/image";
import { useMounted } from "@casper124578/useful";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";

const buttons: modalButtons.ModalButton[] = [
  modalButtons.switchDivision,
  modalButtons.nameSearchBtn,
  modalButtons.plateSearchBtn,
  modalButtons.weaponSearchBtn,
  modalButtons.customFieldSearchBtn,
  modalButtons.create911CallBtn,
  modalButtons.createWrittenWarningBtn,
  modalButtons.createTicketBtn,
  modalButtons.createArrestReportBtn,
  modalButtons.createWarrantBtn,
  modalButtons.createBoloBtn,
  modalButtons.notepadBtn,
];

export function ModalButtons({ initialActiveOfficer }: { initialActiveOfficer: ActiveOfficer }) {
  const _activeOfficer = useLeoState((s) => s.activeOfficer);
  const isMounted = useMounted();
  const activeOfficer = isMounted ? _activeOfficer : initialActiveOfficer;
  const { hasPermissions } = usePermission();

  const isAdmin = hasPermissions(
    defaultPermissions.allDefaultAdminPermissions,
    (u) => u.rank !== Rank.USER,
  );

  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const { state: activeDispatchersState, hasActiveDispatchers } = useActiveDispatchers();
  const { state, execute } = useFetch();
  const { openModal } = useModal();
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
      {!isButtonDisabled && activeOfficer ? (
        <p className="text-lg">
          <span className="font-semibold">{t("Leo.activeOfficer")}: </span>

          {isUnitOfficer(activeOfficer) && activeOfficer.imageId ? (
            <Image
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
      ) : null}

      <div className="mt-2 modal-buttons-grid">
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

        {activeDispatchersState !== "loading" && !hasActiveDispatchers && TONES ? (
          <>
            <Button disabled={isButtonDisabled} onPress={() => openModal(ModalIds.Tones)}>
              {t("Leo.tones")}
            </Button>
            <TonesModal types={["leo"]} />
          </>
        ) : null}
      </div>
    </div>
  );
}
