import type * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { CaretDownFill } from "react-bootstrap-icons";
import type { MapPlayer } from "types/Map";
import { Button } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import type { EmsFdDeputy, Officer } from "@snailycad/types";
import { Infofield } from "components/shared/Infofield";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitRadioChannelModal } from "components/dispatch/active-units/UnitRadioChannelModal";

interface CallItemProps {
  player: MapPlayer;
  setTempUnit: React.Dispatch<React.SetStateAction<Officer | EmsFdDeputy | null>>;
}

export function UnitItem({ setTempUnit, player }: CallItemProps) {
  const { generateCallsign } = useGenerateCallsign();
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const t = useTranslations("Leo");
  const { RADIO_CHANNEL_MANAGEMENT } = useFeatureEnabled();

  const unit = player.unit;
  if (!unit) return null;

  const callsign = generateCallsign(unit);
  const name = makeUnitName(unit);

  function handleStatusClick() {
    setTempUnit(player.unit);
    openModal(ModalIds.ManageUnit);
  }

  function handleShowOnMap() {
    player.ref?.togglePopup();
  }

  return (
    <div className="p-2">
      <Accordion.Item value={player.id}>
        <Accordion.Trigger
          title="Click to expand"
          className="accordion-state flex justify-between w-full pt-1 text-lg font-semibold text-left"
        >
          <p className="capitalize">
            {callsign} {name}
          </p>

          <CaretDownFill
            width={16}
            height={16}
            className="transform w-5 h-5 transition-transform accordion-state-transform"
          />
        </Accordion.Trigger>
        <Accordion.Content className="pt-2 text-base text-neutral-800 dark:text-white">
          <div className="map-column">
            <Infofield label={t("status")}>{unit.status?.value?.value}</Infofield>
            <Infofield label={common("user")}>{player.username}</Infofield>
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
        </Accordion.Content>
      </Accordion.Item>
    </div>
  );
}
