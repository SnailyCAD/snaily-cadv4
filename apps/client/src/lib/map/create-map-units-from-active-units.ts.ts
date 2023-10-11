import {
  CombinedEmsFdUnit,
  CombinedLeoUnit,
  EmsFdDeputy,
  Officer,
  ShouldDoType,
} from "@snailycad/types";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { MapPlayer, PlayerDataEventPayload } from "types/map";

interface ActiveUnitsOptions {
  players: (MapPlayer | PlayerDataEventPayload)[];
  activeOfficers: (Officer | CombinedLeoUnit)[];
  activeDeputies: (EmsFdDeputy | CombinedEmsFdUnit)[];
}

export function createMapUnitsFromActiveUnits({
  players,
  activeOfficers,
  activeDeputies,
}: ActiveUnitsOptions) {
  const activeUnits: MapPlayer[] = [];
  const _activeOfficers = activeOfficers;
  const _activeDeputies = activeDeputies;

  for (const activeUnit of [..._activeOfficers, ..._activeDeputies]) {
    if (!activeUnit.status || activeUnit.status.shouldDo === ShouldDoType.SET_OFF_DUTY) continue;

    if (isUnitCombined(activeUnit) || isUnitCombinedEmsFd(activeUnit)) {
      const player = players.find((player) => findPlayerFromCombinedUnit(player, activeUnit));

      if (!player || !("steamId" in player) || !("discordId" in player)) continue;

      const existing = activeUnits.some((player) => findPlayerFromCombinedUnit(player, activeUnit));

      if (!existing) {
        activeUnits.push({ ...player, unit: activeUnit });
      }

      continue;
    }

    if (!activeUnit.user) continue;

    const player = players.find((player) => findPlayerFromSingleUnit(player, activeUnit));
    if (!player || !("steamId" in player) || !("discordId" in player)) continue;

    const existing = activeUnits.some((player) => findPlayerFromSingleUnit(player, activeUnit));
    if (!existing) {
      activeUnits.push({ ...player, unit: activeUnit });
    }
  }

  return activeUnits;
}

export function findPlayerFromUnit(
  player: MapPlayer | PlayerDataEventPayload,
  activeUnit: Officer | EmsFdDeputy | CombinedLeoUnit | CombinedEmsFdUnit,
) {
  if (isUnitCombined(activeUnit) || isUnitCombinedEmsFd(activeUnit)) {
    return findPlayerFromCombinedUnit(player, activeUnit);
  }

  return findPlayerFromSingleUnit(player, activeUnit);
}

export function findPlayerFromSingleUnit(
  player: MapPlayer | PlayerDataEventPayload,
  activeUnit: Officer | EmsFdDeputy,
) {
  return (
    activeUnit.user?.discordId === player.discordId ||
    activeUnit.user?.steamId === player.convertedSteamId
  );
}

export function findPlayerFromCombinedUnit(
  player: MapPlayer | PlayerDataEventPayload,
  activeUnit: CombinedLeoUnit | CombinedEmsFdUnit,
) {
  const steamIds = isUnitCombinedEmsFd(activeUnit)
    ? activeUnit.deputies.map((deputy) => deputy.user?.steamId)
    : activeUnit.officers.map((officer) => officer.user?.steamId);

  const discordIds = isUnitCombinedEmsFd(activeUnit)
    ? activeUnit.deputies.map((deputy) => deputy.user?.discordId)
    : activeUnit.officers.map((officer) => officer.user?.discordId);

  const filteredSteamIds = steamIds.filter(Boolean) as string[];
  const filteredDiscordIds = discordIds.filter(Boolean) as string[];

  return (
    (player.convertedSteamId && filteredSteamIds.includes(player.convertedSteamId)) ||
    (player.discordId && filteredDiscordIds.includes(player.discordId))
  );
}
