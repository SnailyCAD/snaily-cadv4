import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType } from "types/prisma";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";
import { useEmsFdState } from "state/emsFdState";

interface MButton {
  nameKey: [string, string];
  modalId: string;
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
  {
    nameKey: ["Ems", "activeDeputies"],
    modalId: ModalIds.ActiveDeputies,
  },
];

export const ModalButtons = () => {
  const { activeDeputy } = useEmsFdState();
  const { openModal } = useModal();
  const t = useTranslations();

  const isButtonDisabled =
    !activeDeputy ||
    activeDeputy.status?.shouldDo === ShouldDoType.SET_OFF_DUTY ||
    activeDeputy.statusId === null;

  return (
    <div className="py-2">
      {!isButtonDisabled ? (
        <p className="text-lg">
          <span className="font-semibold">{"Active Deputy"}: </span>
          {`${activeDeputy.badgeNumber} - ${activeDeputy.callsign} ${activeDeputy.name} (${activeDeputy.department?.value})`}
        </p>
      ) : null}

      <ul className="modal-buttons-grid mt-2">
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
};
