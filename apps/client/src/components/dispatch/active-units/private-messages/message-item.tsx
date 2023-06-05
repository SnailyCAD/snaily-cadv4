import { DispatchChat } from "@snailycad/types";
import { isUnitOfficer } from "@snailycad/utils";
import { FullDate } from "components/shared/FullDate";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";

interface Props {
  message: DispatchChat;
}

export function MessageItem(props: Props) {
  const { generateCallsign } = useGenerateCallsign();

  const unitCallsign = props.message.creator?.unit
    ? generateCallsign(props.message.creator.unit, getTemplateId(props.message))
    : null;

  const unitName = props.message.creator?.unit ? makeUnitName(props.message.creator.unit) : null;

  return (
    <li className="flex flex-col rounded-md gap-y-0.5">
      <header className="flex items-center gap-1">
        <span className="font-semibold">
          {unitCallsign ?? "Dispatch"} {unitName}
        </span>
        <span>-</span>
        <span className="select-none text-base text-gray-700 dark:text-gray-400 font-semibold w-fit">
          <FullDate>{props.message.createdAt}</FullDate>
        </span>
      </header>
      <p className="w-full">{props.message.message}</p>
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
