import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { ModalIds } from "types/ModalIds";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { CaretDownFill } from "react-bootstrap-icons";
import type { Full911Call } from "state/dispatch/dispatch-state";
import type { MapCallProps } from "./ActiveMapCalls";
import { useTranslations } from "next-intl";
import { Infofield } from "components/shared/Infofield";
import { isUnitCombined } from "@snailycad/utils";
import { useCall911State } from "state/dispatch/call-911-state";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

interface CallItemProps extends Omit<MapCallProps, "toggledId" | "openItems" | "setOpenItems"> {
  call: Full911Call;
}

export function CallItem({ call, hasMarker, setMarker }: CallItemProps) {
  const t = useTranslations("Calls");
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const { openModal } = useModal();
  const setCurrentlySelectedCall = useCall911State((state) => state.setCurrentlySelectedCall);

  function handleEdit(call: Full911Call) {
    openModal(ModalIds.Manage911Call);
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
      <Accordion.Item value={call.id}>
        <Accordion.Trigger
          title="Click to expand"
          className="accordion-state flex justify-between w-full pt-1 text-lg font-semibold text-left"
        >
          <p>
            {call.location} / {call.name}
          </p>

          <CaretDownFill
            width={16}
            height={16}
            className="transform w-5 h-5 transition-transform accordion-state-transform"
          />
        </Accordion.Trigger>
        <Accordion.Content className="pt-2 text-base text-neutral-800 dark:text-white">
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
        </Accordion.Content>
      </Accordion.Item>
    </div>
  );
}
