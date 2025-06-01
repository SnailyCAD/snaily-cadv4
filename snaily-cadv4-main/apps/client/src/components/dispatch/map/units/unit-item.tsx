import * as React from "react";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { MapPlayer } from "types/map";
import {
  Button,
  AccordionContent,
  AccordionTrigger,
  AccordionItem,
  Infofield,
} from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitRadioChannelModal } from "components/dispatch/active-units/modals/unit-radio-channel-modal";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";

interface CallItemProps {
  player: MapPlayer;
  setTempUnit: React.Dispatch<
    React.SetStateAction<Officer | EmsFdDeputy | CombinedEmsFdUnit | CombinedLeoUnit | null>
  >;
}

export function UnitItem({ setTempUnit, player }: CallItemProps) {
  const { generateCallsign } = useGenerateCallsign();
  const common = useTranslations("Common");
  const modalState = useModal();
  const t = useTranslations("Leo");
  const { RADIO_CHANNEL_MANAGEMENT } = useFeatureEnabled();

  const unit = player.unit;
  if (!unit) return null;

  const callsign = generateCallsign(unit);
  const name = makeUnitName(unit);

  function handleStatusClick() {
    setTempUnit(player.unit);
    modalState.openModal(ModalIds.ManageUnit);
  }

  function handleShowOnMap() {
    player.ref?.togglePopup();
  }

  return (
    <div className="p-2">
      <AccordionItem value={player.id}>
        <AccordionTrigger title="Click to expand">
          <p className="capitalize">
            {callsign} {name}
          </p>
        </AccordionTrigger>
        <AccordionContent className="pt-2 text-base text-neutral-800 dark:text-white">
          <div className="map-column">
            <Infofield label={t("status")}>{unit.status?.value?.value}</Infofield>
            {isUnitCombined(unit) ? (
              <Infofield label={t("officers")}>
                {unit.officers.map((officer, idx) => {
                  const nameAndCallsign = `${generateCallsign(officer)} ${makeUnitName(officer)}`;
                  const showComma = idx !== unit.officers.length - 1;

                  return (
                    <span key={officer.id}>
                      {nameAndCallsign}
                      {showComma ? ", " : ""}
                    </span>
                  );
                })}
              </Infofield>
            ) : isUnitCombinedEmsFd(unit) ? (
              <Infofield label={t("officers")}>
                {unit.deputies.map((deputy, idx) => {
                  const nameAndCallsign = `${generateCallsign(deputy)} ${makeUnitName(deputy)}`;
                  const showComma = idx !== unit.deputies.length - 1;

                  return (
                    <span key={deputy.id}>
                      {nameAndCallsign}
                      {showComma ? ", " : ""}
                    </span>
                  );
                })}
              </Infofield>
            ) : (
              <Infofield label={common("user")}>{player.username}</Infofield>
            )}
            {RADIO_CHANNEL_MANAGEMENT ? (
              <Infofield className="flex !flex-row gap-2 mt-1" label={t("radioChannel")}>
                <UnitRadioChannelModal unit={unit} />
              </Infofield>
            ) : null}

            <div className="flex flex-row gap-2 mt-5">
              <Button onPress={() => handleStatusClick()}>{common("manage")}</Button>
              <Button onPress={() => handleShowOnMap()}>Toggle unit on map</Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}
