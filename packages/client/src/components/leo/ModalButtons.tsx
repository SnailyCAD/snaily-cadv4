import { Button } from "components/Button";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType } from "types/prisma";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";

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
    nameKey: ["Leo", "createWrittenWarning"],
    modalId: ModalIds.CreateWrittenWarning,
  },
  {
    nameKey: ["Leo", "createTicket"],
    modalId: ModalIds.CreateTicket,
  },
  {
    nameKey: ["Leo", "createArrestReport"],
    modalId: ModalIds.CreateArrestReport,
  },
  {
    nameKey: ["Leo", "createBolo"],
    modalId: ModalIds.ManageBolo,
  },
  {
    nameKey: ["Leo", "createWarrant"],
    modalId: ModalIds.CreateWarrant,
  },
  {
    nameKey: ["Leo", "notepad"],
    modalId: ModalIds.Notepad,
  },
  {
    nameKey: ["Leo", "activeOfficers"],
    modalId: ModalIds.ActiveOfficers,
  },
];

export const ModalButtons = () => {
  const { activeOfficer } = useLeoState();
  const { openModal } = useModal();
  const t = useTranslations();

  const isButtonDisabled =
    !activeOfficer ||
    activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY ||
    activeOfficer.statusId === null;

  return (
    <div className="py-2">
      {!isButtonDisabled ? (
        <p className="text-lg">
          <span className="font-semibold">{"Active Officer"}: </span>
          {`${activeOfficer.badgeNumber} - ${activeOfficer.callsign} ${activeOfficer.name} (${activeOfficer.department?.value})`}
        </p>
      ) : null}

      <ul className="modal-buttons-grid mt-2">
        {buttons.map((button, idx) => (
          <Button
            id={button.nameKey[1]}
            key={idx}
            disabled={isButtonDisabled}
            title={isButtonDisabled ? "Go on-duty before continuing" : t(button.nameKey.join("."))}
            onClick={() => openModal(button.modalId)}
          >
            {t(button.nameKey.join("."))}
          </Button>
        ))}
      </ul>
    </div>
  );
};
