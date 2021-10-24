import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";

interface MButton {
  nameKey: [string, string];
  modalId: string;
}

const buttons: MButton[] = [
  {
    nameKey: ["Leo", "nameSearch"],
    modalId: ModalIds.NameSearch,
  },
  {
    nameKey: ["Leo", "plateSearch"],
    modalId: ModalIds.VehicleSearch,
  },
  {
    nameKey: ["Leo", "weaponSearch"],
    modalId: ModalIds.WeaponSearch,
  },
  {
    nameKey: ["Leo", "createBolo"],
    modalId: ModalIds.ManageBolo,
  },
  {
    nameKey: ["Calls", "create911Call"],
    modalId: ModalIds.Manage911Call,
  },
  {
    nameKey: ["Leo", "notepad"],
    modalId: ModalIds.Notepad,
  },
];

export const DispatchModalButtons = () => {
  const { openModal } = useModal();
  const t = useTranslations();

  return (
    <ul className="modal-buttons-grid">
      {buttons.map((button, idx) => (
        <Button
          id={button.nameKey[1]}
          key={idx}
          title={t(button.nameKey.join("."))}
          onClick={() => openModal(button.modalId)}
        >
          {t(button.nameKey.join("."))}
        </Button>
      ))}
    </ul>
  );
};
