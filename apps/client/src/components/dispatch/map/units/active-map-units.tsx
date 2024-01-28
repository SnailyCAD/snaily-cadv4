import * as React from "react";
import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { UnitItem } from "./unit-item";
import { ManageUnitModal } from "components/dispatch/active-units/modals/manage-unit-modal";
import { useMapPlayersStore } from "hooks/realtime/use-map-players";
import { createMapUnitsFromActiveUnits } from "lib/map/create-map-units-from-active-units.ts";
import { Accordion } from "@snailycad/ui";
import { useDispatchMapState } from "state/mapState";

export function ActiveMapUnits() {
  const [tempUnit, setTempUnit] = React.useState<
    null | Officer | EmsFdDeputy | CombinedEmsFdUnit | CombinedLeoUnit
  >(null);
  const players = useMapPlayersStore((state) => state.players);
  const { openUnits, activeMapUnits, setOpenUnits } = useDispatchMapState((state) => ({
    activeMapUnits: state.activeUnits,
    openUnits: state.openUnits,
    setOpenUnits: state.setOpenUnits,
  }));
  const t = useTranslations("Leo");

  const units = React.useMemo(() => {
    return createMapUnitsFromActiveUnits({
      players: Array.from(players.values()),
      activeUnits: activeMapUnits,
    });
  }, [players, activeMapUnits]);

  return (
    <div className="text-white overflow-y-auto max-h-[78vh]">
      {units.length <= 0 ? (
        <p className="text-base mt-2 text-neutral-700 dark:text-gray-300">{t("noActiveUnits")}</p>
      ) : (
        <Accordion value={openUnits} onValueChange={setOpenUnits} type="multiple">
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
    </div>
  );
}
