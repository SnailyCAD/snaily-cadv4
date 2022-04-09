import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { useSignal100 } from "hooks/shared/useSignal100";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { Feature } from "@snailycad/types";
import { useAuth } from "context/AuthContext";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";

interface MButton {
  nameKey: [string, string];
  modalId: ModalIds;
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
  const { activeDispatchers, setActiveDispatchers } = useActiveDispatchers();
  const { user } = useAuth();

  const isActive = activeDispatchers.some((v) => v.userId === user?.id);

  async function handleStateChangeDispatcher() {
    const newState = !isActive;

    const { json } = await execute("/dispatch/dispatchers-state", {
      method: "POST",
      data: { value: newState },
    });

    if (json.dispatcher && newState) {
      setActiveDispatchers([...activeDispatchers, json.dispatcher]);
    } else {
      setActiveDispatchers(activeDispatchers.filter((v) => v.userId !== user?.id));
    }
  }

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
              disabled={!isActive}
              id={button.nameKey[1]}
              key={idx}
              title={t(button.nameKey.join("."))}
              onClick={() => openModal(button.modalId)}
            >
              {t(button.nameKey.join("."))}
            </Button>
          ),
      )}

      <Button disabled={!isActive} onClick={handleSignal100} id="signal100">
        {signal100Enabled ? t("Leo.disableSignal100") : t("Leo.enableSignal100")}
      </Button>

      {features.ACTIVE_DISPATCHERS ? (
        <Button onClick={handleStateChangeDispatcher}>
          {isActive ? t("Leo.goOffDuty") : t("Leo.goOnDuty")}
        </Button>
      ) : null}
    </ul>
  );
}
