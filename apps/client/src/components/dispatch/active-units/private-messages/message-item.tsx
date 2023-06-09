import { DispatchChat } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { isUnitOfficer } from "@snailycad/utils";
import { FullDate } from "components/shared/FullDate";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { classNames } from "lib/classNames";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "use-intl";

interface Props {
  message: DispatchChat;
}

export function MessageItem(props: Props) {
  const { generateCallsign } = useGenerateCallsign();
  const t = useTranslations("Leo");

  const unitCallsign = props.message.creator?.unit
    ? generateCallsign(props.message.creator.unit, getTemplateId(props.message))
    : null;

  const unitName = props.message.creator?.unit ? makeUnitName(props.message.creator.unit) : null;
  const isDispatch = !props.message.creator?.unit;

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
          <Button size="xs" className="text-base mt-1">
            {t("appendedActiveCall", { call: `#${props.message.call.caseNumber}` })}
          </Button>
        ) : null}
        {props.message.incident ? (
          <Button size="xs" className="text-base mt-1">
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
