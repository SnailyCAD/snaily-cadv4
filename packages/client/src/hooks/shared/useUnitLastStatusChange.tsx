import type { EmsFdDeputy } from "@snailycad/types";
import { isUnitCombined } from "@snailycad/utils";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";
import * as React from "react";
import type { ActiveOfficer } from "state/leoState";

interface Options {
  unit: EmsFdDeputy | ActiveOfficer | null;
}

export function useUnitLastStatusChange({ unit }: Options) {
  const { cad } = useAuth();
  const [isInactive, setIsInactive] = React.useState(false);

  function isUnitInactive() {
    if (!cad || !unit || isUnitCombined(unit)) return;

    const inactivityTimeout = cad.miscCadSettings?.inactivityTimeout ?? null;
    if (!inactivityTimeout) {
      return;
    }

    const FIVE_MINUTE_COOLDOWN = 60 * 5 * 1000;
    const milliseconds = inactivityTimeout * (1000 * 60) - FIVE_MINUTE_COOLDOWN;
    const lastStatusChangeTimestamp = unit.lastStatusChangeTimestamp;

    const updatedAt = new Date(new Date().getTime() - milliseconds).getTime();
    const lastStatusChanged = new Date(lastStatusChangeTimestamp).getTime();
    const _isInactive = lastStatusChanged <= updatedAt;

    if (_isInactive !== isInactive) {
      setIsInactive(_isInactive);
    }

    return _isInactive;
  }

  React.useEffect(() => {
    const interval = setInterval(() => {
      isUnitInactive();
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [cad, unit]); // eslint-disable-line

  return { Component, isInactive };
}

function Component({ isInactive }: { isInactive: boolean }) {
  const t = useTranslations("Leo");

  return isInactive ? (
    <div role="alert" className="p-2 px-3 my-2 font-semibold text-black bg-amber-500 rounded-md">
      <p>{t("unitWillBePlacedOffDuty")}</p>
    </div>
  ) : null;
}
