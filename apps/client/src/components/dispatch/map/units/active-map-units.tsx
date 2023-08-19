import * as React from "react";
import { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import type { MapPlayer, PlayerDataEventPayload } from "types/map";
import { createPortal } from "react-dom";
import { usePortal } from "@casperiv/useful";
import { useTranslations } from "next-intl";
import { UnitItem } from "./unit-item";
import { ManageUnitModal } from "components/dispatch/modals/manage-unit-modal";
import { useMapPlayersStore } from "hooks/realtime/use-map-players";
import { createMapUnitsFromActiveUnits } from "lib/map/create-map-units-from-active-units.ts";
import { Accordion } from "@snailycad/ui";

interface Props {
  players: (MapPlayer | PlayerDataEventPayload)[];
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ActiveMapUnits({ openItems, setOpenItems }: Props) {
  const [tempUnit, setTempUnit] = React.useState<
    null | Officer | EmsFdDeputy | CombinedEmsFdUnit | CombinedLeoUnit
  >(null);
  const players = useMapPlayersStore((state) => state.players);
  const portalRef = usePortal("ActiveMapCalls");
  const t = useTranslations("Leo");

  console.log("re-render?", players);

  const { activeOfficers } = useActiveOfficers();
  const { activeDeputies } = useActiveDeputies();
  const units = createMapUnitsFromActiveUnits({
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
          <Accordion value={openItems} onValueChange={setOpenItems} type="multiple">
            {units.map((player, idx) => {
              return (
                <UnitItem
                  setTempUnit={setTempUnit}
                  key={`${player.identifier}-${idx}`}
                  player={player}
                />
              );
            })}
          </Accordion>
        )}

        {tempUnit ? <ManageUnitModal onClose={() => setTempUnit(null)} unit={tempUnit} /> : null}
      </div>,
      portalRef,
    )
  );
}
