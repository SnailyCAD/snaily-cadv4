import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { useSignal100 } from "hooks/shared/useSignal100";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import * as modalButtons from "components/modal-buttons/buttons";
import { ModalButton } from "components/modal-buttons/ModalButton";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import type {
  PostDispatchDispatchersStateData,
  PostDispatchSignal100Data,
} from "@snailycad/types/api";

import dynamic from "next/dynamic";
import { useCall911State } from "state/dispatch/call-911-state";
import { shallow } from "zustand/shallow";
import { ActiveToneType } from "@snailycad/types";
import { useActiveDispatcherState } from "state/dispatch/active-dispatcher-state";

const EnableSignal100Modal = dynamic(
  async () => (await import("./modals/EnableSignal100Modal")).EnableSignal100Modal,
  { ssr: false },
);

const TonesModal = dynamic(async () => (await import("./modals/tones-modal")).TonesModal, {
  ssr: false,
});

const SelectDepartmentModal = dynamic(
  async () => (await import("./modals/select-department-modal")).SelectDepartmentModal,
  { ssr: false },
);

const buttons: modalButtons.ModalButton[] = [
  modalButtons.nameSearchBtn,
  modalButtons.plateSearchBtn,
  modalButtons.weaponSearchBtn,
  modalButtons.addressSearchBtn,
  modalButtons.customFieldSearchBtn,
  modalButtons.createBoloBtn,
  modalButtons.create911CallBtn,
  modalButtons.notepadBtn,
  modalButtons.selectDepartmentBtn,
];

export function DispatchModalButtons() {
  const t = useTranslations();
  const { execute } = useFetch();
  const { enabled: signal100Enabled } = useSignal100();
  const features = useFeatureEnabled();

  const { userActiveDispatcher } = useActiveDispatchers();
  const setUserActiveDispatcher = useActiveDispatcherState((s) => s.setUserActiveDispatcher);

  const { ACTIVE_DISPATCHERS, TONES } = useFeatureEnabled();
  const { openModal } = useModal();
  const { calls, setCalls } = useCall911State(
    (state) => ({
      calls: state.calls,
      setCalls: state.setCalls,
    }),
    shallow,
  );

  const isActive = ACTIVE_DISPATCHERS ? !!userActiveDispatcher : true;

  async function handleStateChangeDispatcher() {
    const newState = !isActive;

    const { json } = await execute<PostDispatchDispatchersStateData>({
      path: "/dispatch/dispatchers-state",
      method: "POST",
      data: { value: newState },
    });

    setUserActiveDispatcher(json.dispatcher, json.activeDispatchersCount);
  }

  async function handleSignal100() {
    if (signal100Enabled) {
      await execute<PostDispatchSignal100Data>({
        path: "/dispatch/signal-100",
        method: "POST",
        data: { value: !signal100Enabled },
      });

      setCalls(calls.map((call) => ({ ...call, isSignal100: false })));
    } else {
      openModal(ModalIds.EnableSignal100);
    }
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

      {TONES ? <TonesModal types={[ActiveToneType.LEO, ActiveToneType.EMS_FD]} /> : null}
      {signal100Enabled ? null : <EnableSignal100Modal />}
      <SelectDepartmentModal />
    </div>
  );
}
