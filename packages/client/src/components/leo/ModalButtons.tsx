import { Button } from "components/Button";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { StatusEnum } from "types/prisma";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";

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
    modalId: ModalIds.PlateSearch,
  },
  {
    nameKey: "weaponSearch",
    modalId: ModalIds.WeaponSearch,
  },
  {
    nameKey: "createWrittenWarning",
    modalId: ModalIds.CreateWrittenWarning,
  },
  {
    nameKey: "createTicket",
    modalId: ModalIds.CreateTicket,
  },
  {
    nameKey: "createArrestReport",
    modalId: ModalIds.CreateArrestReport,
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

export const ModalButtons = () => {
  const { activeOfficer } = useLeoState();
  const { openModal } = useModal();
  const t = useTranslations("Leo");

  const isButtonDisabled =
    !activeOfficer ||
    activeOfficer.status === StatusEnum.OFF_DUTY ||
    activeOfficer.status2 === null;

  return (
    <div className="py-2">
      {!isButtonDisabled ? (
        <p className="text-lg">
          <span className="font-semibold">{"Active Officer"}: </span>
          {`${activeOfficer.badgeNumber} - ${activeOfficer.callsign} ${activeOfficer.name} (${activeOfficer.department?.value})`}
        </p>
      ) : null}

      <ul className="space-x-2 mt-3">
        {buttons.map((button, idx) => (
          <Button
            id={button.nameKey}
            key={idx}
            disabled={isButtonDisabled}
            title={isButtonDisabled ? "Go on-duty before continuing" : button.nameKey}
            onClick={() => openModal(button.modalId)}
          >
            {t(button.nameKey)}
          </Button>
        ))}
      </ul>
    </div>
  );
};
