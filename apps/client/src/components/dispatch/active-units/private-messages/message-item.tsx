import type { DispatchChat } from "@snailycad/types";
import { Button, FullDate } from "@snailycad/ui";
import { isUnitOfficer } from "@snailycad/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { classNames } from "lib/classNames";
import { makeUnitName } from "lib/utils";
import { type Full911Call, useCall911State } from "state/dispatch/call-911-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

interface Props {
  message: DispatchChat;
}

export function MessageItem(props: Props) {
  const { generateCallsign } = useGenerateCallsign();
  const t = useTranslations("Leo");
  const setCurrentlySelectedCall = useCall911State((state) => state.setCurrentlySelectedCall);
  const modalState = useModal();

  const unitCallsign = props.message.creator?.unit
    ? generateCallsign(props.message.creator.unit, getTemplateId(props.message))
    : null;

  const unitName = props.message.creator?.unit ? makeUnitName(props.message.creator.unit) : null;
  const isDispatch = !props.message.creator?.unit;

  function handleCallPress() {
    if (!props.message.call) return;

    setCurrentlySelectedCall(props.message.call as Full911Call);
    modalState.openModal(ModalIds.Manage911Call);
  }

  function handleIncidentPress() {
    if (!props.message.incident) return;

    modalState.openModal(ModalIds.ManageIncident, props.message.incident);
  }

  return (
    <li className="flex flex-col rounded-md gap-y-0.5">
      <header
        className={classNames(
          "flex items-center gap-1",
          isDispatch ? "text-blue-400" : "text-green-400",
        )}
      >
        <span className="font-semibold">
          {unitCallsign ?? "Dispatch"} {unitName}
        </span>
        <span>-</span>
        <span className="select-none text-base text-gray-700 dark:text-gray-400 font-semibold w-fit">
          <FullDate>{props.message.createdAt}</FullDate>
        </span>
      </header>
      <p className="w-full">{props.message.message}</p>

      <footer className="flex items-center gap-2">
        {props.message.call ? (
          <Button onPress={handleCallPress} size="xs" className="text-base mt-1">
            {t("appendedActiveCall", { call: `#${props.message.call.caseNumber}` })}
          </Button>
        ) : null}
        {props.message.incident ? (
          <Button onPress={handleIncidentPress} size="xs" className="text-base mt-1">
            {t("appendedActiveIncident", { incident: `#${props.message.incident.caseNumber}` })}
          </Button>
        ) : null}
      </footer>
    </li>
  );
}

function getTemplateId(chat: DispatchChat) {
  if (!chat.creator?.unit) return undefined;

  if (isUnitOfficer(chat.creator.unit)) {
    return "callsignTemplate";
  }

  return "pairedUnitTemplate";
}
