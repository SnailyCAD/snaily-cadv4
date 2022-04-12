import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { useSignal100 } from "hooks/shared/useSignal100";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useAuth } from "context/AuthContext";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import * as modalButtons from "components/modal-buttons/buttons";
import { ModalButton } from "components/modal-buttons/ModalButton";

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
      {buttons.map((button, idx) => (
        <ModalButton disabled={!isActive} key={idx} button={button} />
      ))}

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
