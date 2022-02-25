import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useGenerateCallsign } from "../useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";

export function usePanicButton() {
  const [unit, setUnit] = React.useState<EmsFdDeputy | Officer | CombinedLeoUnit | null>(null);

  useListener(SocketEvents.PANIC_BUTTON_ON, (officer: Officer) => {
    setUnit(officer);
  });

  useListener(SocketEvents.PANIC_BUTTON_OFF, () => {
    setUnit(null);
  });

  return { unit, PanicButton: Component };
}

function Component({ unit }: { unit: Officer | EmsFdDeputy | CombinedLeoUnit }) {
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
