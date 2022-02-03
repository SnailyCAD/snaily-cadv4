import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType } from "@snailycad/types";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";
import { useEmsFdState } from "state/emsFdState";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";

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

export function ModalButtons() {
  const { activeDeputy } = useEmsFdState();
  const { openModal } = useModal();
  const t = useTranslations();
  const generateCallsign = useGenerateCallsign();

  const isButtonDisabled =
    !activeDeputy ||
    activeDeputy.status?.shouldDo === ShouldDoType.SET_OFF_DUTY ||
    activeDeputy.statusId === null;

  return (
    <div className="py-2">
      {!isButtonDisabled ? (
        <p className="text-lg">
          <span className="font-semibold">{t("Ems.activeDeputy")}: </span>
          {`${generateCallsign(activeDeputy)} ${makeUnitName(activeDeputy)}`}
        </p>
      ) : null}

      <ul className="mt-2 modal-buttons-grid">
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
      </ul>
    </div>
  );
}
