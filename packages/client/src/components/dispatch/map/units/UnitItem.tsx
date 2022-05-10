import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { CaretDownFill } from "react-bootstrap-icons";
import type { MapPlayer } from "./RenderMapPlayers";

interface CallItemProps {
  player: MapPlayer;
}

export function UnitItem({ player }: CallItemProps) {
  const { generateCallsign } = useGenerateCallsign();

  const unit = player.unit;
  if (!unit) return null;

  const callsign = generateCallsign(unit);
  const name = makeUnitName(unit);

  return (
    <div className="p-2">
      <Accordion.Item value={player.id}>
        <Accordion.Trigger
          title="Click to expand"
          className="accordion-state flex justify-between w-full pt-1 text-lg font-semibold text-left"
        >
          <p>
            {name} {callsign}
          </p>

          <CaretDownFill
            width={16}
            height={16}
            className="transform w-5 h-5 transition-transform accordion-state-transform"
          />
        </Accordion.Trigger>
        <Accordion.Content className="pt-2 text-base text-neutral-800 dark:text-white">
          <div className="map-column">
            <div className="grid grid-cols-2 grid-flow-col gap-2 mt-2">TODO</div>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </div>
  );
}
