import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { ModalIds } from "types/ModalIds";
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { CaretDownFill } from "react-bootstrap-icons";
import type { Full911Call } from "state/dispatchState";
import type { MapCallProps } from "./ActiveMapCalls";
import { useTranslations } from "next-intl";
import { Infofield } from "components/shared/Infofield";

interface CallItemProps extends Omit<MapCallProps, "toggledId" | "openItems" | "setOpenItems"> {
  call: Full911Call;
  setTempCall: React.Dispatch<React.SetStateAction<Full911Call | null>>;
}

export function CallItem({ call, setTempCall, hasMarker, setMarker }: CallItemProps) {
  const t = useTranslations("Calls");
  const common = useTranslations("Common");
  const generateCallsign = useGenerateCallsign();
  const { openModal } = useModal();

  function handleEdit(call: Full911Call) {
    openModal(ModalIds.Manage911Call);
    setTempCall(call);
  }

  function handleViewDescription(call: Full911Call) {
    setTempCall(call);
    openModal(ModalIds.Description, call);
  }

  const assignedUnits = React.useMemo(() => {
    return call.assignedUnits.map((c, i) => {
      const comma = i !== call.assignedUnits.length - 1 ? ", " : " ";
      return (
        <span key={c.id}>
          {makeUnitName(c.unit)} {generateCallsign(c.unit)}
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
            <Infofield label={t("assignedUnits")}>
              {assignedUnits.length <= 0 ? common("none") : assignedUnits}
            </Infofield>

            <div className="flex flex-col mt-4">
              <Button onClick={() => handleViewDescription(call)}>
                {common("viewDescription")}
              </Button>

              <div className="grid grid-cols-2 grid-flow-col gap-2 mt-2">
                <Button onClick={() => handleEdit(call)}>{common("manage")}</Button>

                <Button
                  className="col-span-2"
                  onClick={() => setMarker(call, hasMarker(call.id) ? "remove" : "set")}
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
