import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { FullDeputy, FullOfficer } from "state/dispatchState";
import { useGenerateCallsign } from "./useGenerateCallsign";

export function usePanicButton() {
  const [unit, setUnit] = React.useState<FullDeputy | FullOfficer | null>(null);

  useListener(SocketEvents.PANIC_BUTTON, (officer: FullOfficer) => {
    setUnit(officer);
  });

  return { unit, PanicButton: Component };
}

const Component = ({ unit }: { unit: FullOfficer | FullDeputy }) => {
  const t = useTranslations("Leo");
  const generateCallsign = useGenerateCallsign();

  return (
    <div role="alert" className="font-semibold text-white bg-red-500 p-2 px-3 rounded-md my-2">
      <p>
        {t.rich("panicButtonLeo", {
          officer: `${generateCallsign(unit)} ${unit.name}`,
        })}
      </p>
    </div>
  );
};
