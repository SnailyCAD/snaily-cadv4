import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";

interface MButton {
  nameKey: string;
  modalId: string;
}

const buttons: MButton[] = [
  {
    nameKey: "nameSearch",
    modalId: ModalIds.NameSearch,
  },
  {
    nameKey: "plateSearch",
    modalId: ModalIds.VehicleSearch,
  },
  {
    nameKey: "weaponSearch",
    modalId: ModalIds.WeaponSearch,
  },
  {
    nameKey: "addressSearch",
    modalId: ModalIds.AddressSearch,
  },
  {
    nameKey: "createBolo",
    modalId: ModalIds.ManageBolo,
  },
  {
    nameKey: "notepad",
    modalId: ModalIds.Notepad,
  },
  {
    nameKey: "activeOfficers",
    modalId: ModalIds.ActiveOfficers,
  },
];

export const DispatchModalButtons = () => {
  const { openModal } = useModal();
  const t = useTranslations("Leo");

  return (
    <ul className="modal-buttons-grid">
      {buttons.map((button, idx) => (
        <Button
          id={button.nameKey}
          key={idx}
          title={button.nameKey}
          onClick={() => openModal(button.modalId)}
        >
          {t(button.nameKey)}
        </Button>
      ))}
    </ul>
  );
};
