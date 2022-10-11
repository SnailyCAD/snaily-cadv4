import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { useSignal100 } from "hooks/shared/useSignal100";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useAuth } from "context/AuthContext";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import * as modalButtons from "components/modal-buttons/buttons";
import { ModalButton } from "components/modal-buttons/ModalButton";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { TonesModal } from "./modals/TonesModal";
import type {
  PostDispatchDispatchersStateData,
  PostDispatchSignal100Data,
} from "@snailycad/types/api";

const buttons: modalButtons.ModalButton[] = [
  modalButtons.nameSearchBtn,
  modalButtons.plateSearchBtn,
  modalButtons.weaponSearchBtn,
  modalButtons.addressSearchBtn,
  modalButtons.customFieldSearchBtn,
  modalButtons.createBoloBtn,
  modalButtons.create911CallBtn,
  modalButtons.notepadBtn,
];

export function DispatchModalButtons() {
  const t = useTranslations();
  const { execute } = useFetch();
  const { enabled: signal100Enabled } = useSignal100();
  const features = useFeatureEnabled();
  const { activeDispatchers, setActiveDispatchers } = useActiveDispatchers();
  const { user } = useAuth();
  const { ACTIVE_DISPATCHERS, TONES } = useFeatureEnabled();
  const { openModal } = useModal();

  const isActive = ACTIVE_DISPATCHERS ? activeDispatchers.some((v) => v.userId === user?.id) : true;

  async function handleStateChangeDispatcher() {
    const newState = !isActive;

    const { json } = await execute<PostDispatchDispatchersStateData>({
      path: "/dispatch/dispatchers-state",
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
    await execute<PostDispatchSignal100Data>({
      path: "/dispatch/signal-100",
      method: "POST",
      data: { value: !signal100Enabled },
    });
  }

  return (
    <div className="modal-buttons-grid py-2 pb-3 px-4">
      {buttons.map((button, idx) => (
        <ModalButton disabled={!isActive} key={idx} button={button} />
      ))}

      <Button disabled={!isActive} onPress={handleSignal100} id="signal100">
        {signal100Enabled ? t("Leo.disableSignal100") : t("Leo.enableSignal100")}
      </Button>

      {TONES ? (
        <Button disabled={!isActive} onPress={() => openModal(ModalIds.Tones)}>
          {t("Leo.tones")}
        </Button>
      ) : null}

      {features.ACTIVE_DISPATCHERS ? (
        <Button onPress={handleStateChangeDispatcher}>
          {isActive ? t("Leo.goOffDuty") : t("Leo.goOnDuty")}
        </Button>
      ) : null}

      {TONES ? <TonesModal types={["leo", "ems-fd"]} /> : null}
    </div>
  );
}
