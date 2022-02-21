import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import type { FullDeputy, FullOfficer } from "state/dispatchState";
import { useGenerateCallsign } from "../useGenerateCallsign";
import { makeUnitName } from "lib/utils";

export function usePanicButton() {
  const [unit, setUnit] = React.useState<FullDeputy | FullOfficer | null>(null);

  useListener(SocketEvents.PANIC_BUTTON_ON, (officer: FullOfficer) => {
    setUnit(officer);
  });

  useListener(SocketEvents.PANIC_BUTTON_OFF, () => {
    setUnit(null);
  });

  return { unit, PanicButton: Component };
}

function Component({ unit }: { unit: FullOfficer | FullDeputy }) {
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();
  const callsign = generateCallsign(
    unit,
    "officers" in unit ? "pairedUnitTemplate" : "callsignTemplate",
  );

  return (
    <div role="alert" className="p-2 px-3 my-2 font-semibold text-white bg-red-500 rounded-md">
      <p>
        {t.rich("panicButtonLeo", {
          officer: `${callsign} ${makeUnitName(unit)}`,
        })}
      </p>
    </div>
  );
}
