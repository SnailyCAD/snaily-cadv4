import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { useSignal100 } from "hooks/useSignal100";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Feature } from "types/prisma";

interface MButton {
  nameKey: [string, string];
  modalId: string;
  isEnabled?(features: Record<Feature, boolean>): boolean;
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
    isEnabled: ({ WEAPON_REGISTRATION }) => WEAPON_REGISTRATION,
  },

  {
    nameKey: ["Leo", "addressSearch"],
    modalId: ModalIds.AddressSearch,
  },
  {
    nameKey: ["Leo", "createBolo"],
    modalId: ModalIds.ManageBolo,
  },
  {
    nameKey: ["Calls", "create911Call"],
    modalId: ModalIds.Manage911Call,
    isEnabled: ({ CALLS_911 }) => CALLS_911,
  },
  {
    nameKey: ["Leo", "notepad"],
    modalId: ModalIds.Notepad,
  },
];

export function DispatchModalButtons() {
  const { openModal } = useModal();
  const t = useTranslations();
  const { execute } = useFetch();
  const { signal100Enabled } = useSignal100();
  const features = useFeatureEnabled();

  async function handleSignal100() {
    await execute("/dispatch/signal-100", {
      method: "POST",
      data: { value: !signal100Enabled },
    });
  }

  return (
    <ul className="modal-buttons-grid">
      {buttons.map(
        (button, idx) =>
          (button.isEnabled?.(features) ?? true) && (
            <Button
              id={button.nameKey[1]}
              key={idx}
              title={t(button.nameKey.join("."))}
              onClick={() => openModal(button.modalId)}
            >
              {t(button.nameKey.join("."))}
            </Button>
          ),
      )}

      <Button onClick={handleSignal100} id="signal100" title={t("Leo.disableSignal100")}>
        {signal100Enabled ? t("Leo.disableSignal100") : t("Leo.enableSignal100")}
      </Button>
    </ul>
  );
}
