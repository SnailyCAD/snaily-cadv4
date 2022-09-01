import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType } from "@snailycad/types";
import { useModal } from "state/modalState";
import { useTranslations } from "use-intl";
import { ActiveDeputy, useEmsFdState } from "state/emsFdState";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import useFetch from "lib/useFetch";
import type { PostEmsFdTogglePanicButtonData } from "@snailycad/types/api";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { TonesModal } from "components/dispatch/modals/TonesModal";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useMounted } from "@casper124578/useful";

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
    nameKey: ["Leo", "notepad"],
    modalId: ModalIds.Notepad,
  },
];

export function ModalButtons({
  initialActiveDeputy,
}: {
  initialActiveDeputy: ActiveDeputy | null;
}) {
  const _activeDeputy = useEmsFdState((s) => s.activeDeputy);
  const isMounted = useMounted();
  const { openModal } = useModal();
  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const { execute } = useFetch();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { PANIC_BUTTON } = useFeatureEnabled();
  const activeDeputy = isMounted ? _activeDeputy : initialActiveDeputy;

  const isButtonDisabled =
    !activeDeputy ||
    activeDeputy.status?.shouldDo === ShouldDoType.SET_OFF_DUTY ||
    activeDeputy.statusId === null;

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
      {!isButtonDisabled ? (
        <p className="text-lg">
          <span className="font-semibold">{t("Ems.activeDeputy")}: </span>
          {generateCallsign(activeDeputy)} {makeUnitName(activeDeputy)}
        </p>
      ) : null}

      <div className="mt-2 modal-buttons-grid">
        {buttons.map((button, idx) => (
          <Button
            id={button.nameKey[1]}
            key={idx}
            disabled={isButtonDisabled}
            title={isButtonDisabled ? "Go on-duty before continuing" : button.nameKey[1]}
            onClick={() => openModal(button.modalId)}
          >
            {t(button.nameKey.join("."))}
          </Button>
        ))}

        {PANIC_BUTTON ? (
          <Button
            id="panicButton"
            disabled={isButtonDisabled}
            title={isButtonDisabled ? "Go on-duty before continuing" : t("Leo.panicButton")}
            onClick={handlePanic}
          >
            {t("Leo.panicButton")}
          </Button>
        ) : null}

        {!hasActiveDispatchers ? (
          <>
            <Button disabled={isButtonDisabled} onClick={() => openModal(ModalIds.Tones)}>
              {t("Leo.tones")}
            </Button>

            <TonesModal types={["ems-fd"]} />
          </>
        ) : null}
      </div>
    </div>
  );
}
