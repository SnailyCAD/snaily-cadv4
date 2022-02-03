import { Button } from "components/Button";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType } from "@snailycad/types";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { makeUnitName } from "lib/utils";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

interface MButton {
  nameKey: [string, string];
  modalId: ModalIds;
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
];

export function ModalButtons() {
  const { activeOfficer } = useLeoState();
  const { openModal } = useModal();
  const t = useTranslations();
  const generateCallsign = useGenerateCallsign();
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  const { execute } = useFetch();

  async function handlePanic() {
    if (!activeOfficer) return;

    await execute("/leo/panic-button", {
      method: "POST",
      data: { officerId: activeOfficer.id },
    });
  }

  const isButtonDisabled =
    !activeOfficer ||
    activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY ||
    activeOfficer.statusId === null;

  const name =
    !isButtonDisabled &&
    ("officers" in activeOfficer
      ? activeOfficer.callsign
      : `${generateCallsign(activeOfficer)} ${makeUnitName(activeOfficer)}`);

  return (
    <div className="py-2">
      {!isButtonDisabled ? (
        <p className="text-lg">
          <span className="font-semibold">{t("Leo.activeOfficer")}: </span>
          {name}
        </p>
      ) : null}

      <ul className="mt-2 modal-buttons-grid">
        {buttons.map((button, idx) =>
          button.nameKey[1] === "weaponSearch" && !WEAPON_REGISTRATION ? null : (
            <Button
              id={button.nameKey[1]}
              key={idx}
              disabled={isButtonDisabled}
              title={
                isButtonDisabled ? "Go on-duty before continuing" : t(button.nameKey.join("."))
              }
              onClick={() => openModal(button.modalId)}
            >
              {t(button.nameKey.join("."))}
            </Button>
          ),
        )}

        <Button
          id="panicButton"
          disabled={isButtonDisabled}
          title={isButtonDisabled ? "Go on-duty before continuing" : t("Leo.panicButton")}
          onClick={handlePanic}
        >
          {t("Leo.panicButton")}
        </Button>
      </ul>
    </div>
  );
}
