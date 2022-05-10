import * as React from "react";
import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { isUnitCombined } from "@snailycad/utils";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import type { MapPlayer, PlayerDataEventPayload } from "./RenderMapPlayers";
import { Root as AccordionRoot } from "@radix-ui/react-accordion";
import { createPortal } from "react-dom";
import { usePortal } from "@casper124578/useful";
import { useTranslations } from "next-intl";
import { UnitItem } from "./UnitItem";

interface Props {
  players: (MapPlayer | PlayerDataEventPayload)[];
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ActiveMapUnits({ players, openItems, setOpenItems }: Props) {
  const portalRef = usePortal("ActiveMapCalls");
  const t = useTranslations("Leo");
  t;

  const { activeOfficers } = useActiveOfficers();
  const { activeDeputies } = useActiveDeputies();
  const units = makeActiveUnits({
    players,
    activeOfficers,
    activeDeputies,
  });

  return (
    portalRef &&
    createPortal(
      <div
        id="map-calls"
        className="fixed z-50 p-3 top-20 right-4 w-80 rounded-md shadow bg-gray-50 dark:bg-dark-bg dark:text-white"
      >
        <h1 className="text-xl font-semibold">{"activeUnits"}</h1>
        {units.length <= 0 ? (
          <p>{"noActiveUnits"}</p>
        ) : (
          <AccordionRoot value={openItems} onValueChange={setOpenItems} type="multiple">
            {units.map((player) => {
              return <UnitItem key={player.identifier} player={player} />;
            })}
          </AccordionRoot>
        )}
      </div>,
      portalRef,
    )
  );
}

interface ActiveUnitsOptions {
  players: (MapPlayer | PlayerDataEventPayload)[];
  activeOfficers: (Officer | CombinedLeoUnit)[];
  activeDeputies: EmsFdDeputy[];
}

function makeActiveUnits({ players, activeOfficers, activeDeputies }: ActiveUnitsOptions) {
  const activeUnits: MapPlayer[] = [];

  for (const activeUnit of [...activeOfficers, ...activeDeputies]) {
    // todo: allow combined units
    if (isUnitCombined(activeUnit)) continue;

    const steamId = activeUnit.user.steamId;
    const player = players.find((v) => "steamId" in v && v.steamId === steamId);

    if (!player || !("steamId" in player)) continue;

    const existing = activeUnits.some((v) => v.steamId === player.steamId);

    if (player && !existing) {
      activeUnits.push({ ...player, unit: activeUnit });
    }
  }

  return activeUnits;
}
