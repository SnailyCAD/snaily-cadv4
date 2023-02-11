import * as React from "react";
import type {
  CombinedEmsFdUnit,
  CombinedLeoUnit,
  EmsFdDeputy,
  Officer,
  UnitQualification,
} from "@snailycad/types";
import { useDebounce, useHoverDirty } from "react-use";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { HoverCard } from "components/shared/HoverCard";
import useFetch from "lib/useFetch";
import { create } from "zustand";
import { Loader } from "@snailycad/ui";
import type { GetUnitQualificationsByUnitIdData } from "@snailycad/types/api";
import dynamic from "next/dynamic";

const UnitQualificationsTable = dynamic(
  async () => (await import("./UnitQualificationsTable")).UnitQualificationsTable,
  { ssr: false },
);

interface Props {
  unit:
    | ((Officer | EmsFdDeputy) & { qualifications?: UnitQualification[] })
    | CombinedLeoUnit
    | CombinedEmsFdUnit;
  children: React.ReactNode;
  canBeOpened?: boolean;
}

interface CacheStore {
  units: Record<string, UnitQualification[]>;
  setUnits(units: CacheStore["units"]): void;
}

const useCacheStore = create<CacheStore>((set) => ({
  units: {},
  setUnits: (units) => set({ units }),
}));

export function ActiveUnitsQualificationsCard({ canBeOpened = true, unit, children }: Props) {
  const { state, execute } = useFetch();
  const { units, setUnits } = useCacheStore();

  const hoverRef = React.useRef(null);
  const hovered = useHoverDirty(hoverRef);
  const cache = units[unit.id];

  const handleHover = React.useCallback(async () => {
    if (isUnitCombined(unit)) return;
    if (units[unit.id]) return;

    const { json } = await execute<GetUnitQualificationsByUnitIdData>({
      path: `/leo/qualifications/${unit.id}`,
      method: "GET",
      noToast: true,
    });

    if (Array.isArray(json)) {
      setUnits({
        ...units,
        [unit.id]: json,
      });
    }
  }, [unit, units, setUnits, execute]);

  useDebounce(
    () => {
      if (hovered && state === null) {
        handleHover();
      }
    },
    500,
    [hovered, state],
  );

  if (isUnitCombined(unit) || isUnitCombinedEmsFd(unit) || !canBeOpened) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  return (
    <HoverCard
      openDelay={500}
      showArrow={false}
      contentProps={{ sideOffset: 0, side: "bottom" }}
      pointerEvents
      trigger={<span ref={hoverRef}>{children}</span>}
    >
      {state === "loading" ? (
        <Loader />
      ) : (
        <div className="min-w-[450px]">
          <UnitQualificationsTable unit={{ ...unit, qualifications: cache ?? [] }} />
        </div>
      )}
    </HoverCard>
  );
}
