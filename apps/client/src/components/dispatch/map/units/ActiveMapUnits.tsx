import * as React from "react";
import {
  CombinedEmsFdUnit,
  CombinedLeoUnit,
  EmsFdDeputy,
  Officer,
  ShouldDoType,
} from "@snailycad/types";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import type { MapPlayer, PlayerDataEventPayload } from "types/Map";
import { Root as AccordionRoot } from "@radix-ui/react-accordion";
import { createPortal } from "react-dom";
import { usePortal } from "@casper124578/useful";
import { useTranslations } from "next-intl";
import { UnitItem } from "./UnitItem";
import { ManageUnitModal } from "components/dispatch/modals/manage-unit-modal";
import { useMapPlayersStore } from "hooks/realtime/use-map-players";

interface Props {
  players: (MapPlayer | PlayerDataEventPayload)[];
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ActiveMapUnits({ openItems, setOpenItems }: Props) {
  const [tempUnit, setTempUnit] = React.useState<null | Officer | EmsFdDeputy>(null);
  const { players } = useMapPlayersStore();

  const portalRef = usePortal("ActiveMapCalls");
  const t = useTranslations("Leo");

  const { activeOfficers } = useActiveOfficers();
  const { activeDeputies } = useActiveDeputies();
  const units = makeActiveUnits({
    players: Array.from(players.values()),
    activeOfficers,
    activeDeputies,
  });

  return (
    portalRef &&
    createPortal(
      <div
        id="map-calls"
        className="fixed z-[29] p-3 top-20 right-4 w-80 rounded-md shadow bg-gray-50 dark:bg-tertiary dark:border dark:border-secondary dark:text-white"
      >
        <h1 className="text-xl font-semibold">{t("activeUnits")}</h1>
        {units.length <= 0 ? (
          <p className="text-base mt-2 text-neutral-700 dark:text-gray-300">{t("noActiveUnits")}</p>
        ) : (
          <AccordionRoot value={openItems} onValueChange={setOpenItems} type="multiple">
            {units.map((player, idx) => {
              return (
                <UnitItem
                  setTempUnit={setTempUnit}
                  key={`${player.identifier}-${idx}`}
                  player={player}
                />
              );
            })}
          </AccordionRoot>
        )}

        {tempUnit ? <ManageUnitModal onClose={() => setTempUnit(null)} unit={tempUnit} /> : null}
      </div>,
      portalRef,
    )
  );
}

interface ActiveUnitsOptions {
  players: (MapPlayer | PlayerDataEventPayload)[];
  activeOfficers: (Officer | CombinedLeoUnit)[];
  activeDeputies: (EmsFdDeputy | CombinedEmsFdUnit)[];
}

function makeActiveUnits({ players, activeOfficers, activeDeputies }: ActiveUnitsOptions) {
  const activeUnits: MapPlayer[] = [];
  const _activeOfficers = activeOfficers.flatMap((officer) => {
    if (isUnitCombined(officer)) return officer.officers;
    return officer;
  });
  const _activeDeputies = activeDeputies.flatMap((deputy) => {
    if (isUnitCombinedEmsFd(deputy)) return deputy.deputies;
    return deputy;
  });

  for (const activeUnit of [..._activeOfficers, ..._activeDeputies]) {
    if (!activeUnit.status || activeUnit.status.shouldDo === ShouldDoType.SET_OFF_DUTY) continue;
    if (!activeUnit.user) continue;

    const steamId = activeUnit.user.steamId;
    const discordId = activeUnit.user.discordId;

    const player = players.find((player) => {
      return player.discordId === discordId || player.convertedSteamId === steamId;
    });

    if (!player || !("steamId" in player) || !("discordId" in player)) continue;

    const existing = activeUnits.some((unit) => {
      return unit.discordId === discordId || unit.convertedSteamId === steamId;
    });

    if (player && !existing) {
      activeUnits.push({ ...player, unit: activeUnit });
    }
  }

  return activeUnits;
}
