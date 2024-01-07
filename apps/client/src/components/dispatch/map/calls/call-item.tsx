import * as React from "react";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { ModalIds } from "types/modal-ids";
import {
  Button,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
  Infofield,
} from "@snailycad/ui";
import { useModal } from "state/modalState";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { useTranslations } from "next-intl";
import { isUnitCombined } from "@snailycad/utils";
import { useCall911State } from "state/dispatch/call-911-state";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

interface CallItemProps {
  hasMarker(callId: string): boolean;
  setMarker(call: Full911Call, type: "remove" | "set"): void;
  call: Full911Call;
}

export function CallItem({ call, hasMarker, setMarker }: CallItemProps) {
  const t = useTranslations("Calls");
  const common = useTranslations("Common");
  const setCurrentlySelectedCall = useCall911State((state) => state.setCurrentlySelectedCall);

  const { generateCallsign } = useGenerateCallsign();
  const modalState = useModal();

  function handleEdit(call: Full911Call) {
    modalState.openModal(ModalIds.Manage911Call);
    setCurrentlySelectedCall(call);
  }

  const assignedUnits = React.useMemo(() => {
    return call.assignedUnits.map((unit, i) => {
      const comma = i !== call.assignedUnits.length - 1 ? ", " : " ";
      if (!unit.unit) {
        return null;
      }

      const unitName = isUnitCombined(unit.unit)
        ? generateCallsign(unit.unit, "pairedUnitTemplate")
        : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;

      return (
        <span key={unit.id}>
          {unitName}
          {comma}
        </span>
      );
    });
  }, [call, generateCallsign]);

  return (
    <div className="p-2">
      <AccordionItem value={call.id}>
        <AccordionTrigger title="Click to expand">
          <p>
            {call.location} / {call.name}
          </p>
        </AccordionTrigger>
        <AccordionContent className="pt-2 text-base text-neutral-800 dark:text-white">
          <div className="map-column">
            <Infofield label={common("name")}>{call.name}</Infofield>
            <Infofield label={t("location")}>{call.location}</Infofield>
            <Infofield label={t("postal")}>{call.postal || common("none")}</Infofield>
            <Infofield label={t("description")}>
              <CallDescription data={call} />
            </Infofield>
            <Infofield label={t("assignedUnits")}>
              {assignedUnits.length <= 0 ? common("none") : assignedUnits}
            </Infofield>

            <div className="flex flex-col mt-4">
              <div className="grid grid-cols-2 grid-flow-col gap-2 mt-2">
                <Button onPress={() => handleEdit(call)}>{common("manage")}</Button>

                <Button
                  className="col-span-2"
                  onPress={() => setMarker(call, hasMarker(call.id) ? "remove" : "set")}
                >
                  {hasMarker(call.id) ? t("removeMarker") : t("setMarker")}
                </Button>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}
