import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { useSignal100 } from "hooks/useSignal100";

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
  const { execute } = useFetch();
  const { signal100Enabled } = useSignal100();

  async function handleSignal100() {
    await execute("/dispatch/signal-100", {
      method: "POST",
      data: { value: !signal100Enabled },
    });
  }

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

      <Button onClick={handleSignal100} id="signal100" title={t("Leo.disableSignal100")}>
        {signal100Enabled ? t("Leo.disableSignal100") : t("Leo.enableSignal100")}
      </Button>
    </ul>
  );
};
