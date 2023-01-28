import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useGenerateCallsign } from "../useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { useAudio } from "react-use";
import { useAuth } from "context/AuthContext";

const PANIC_BUTTON_SRC = "/sounds/panic-button.mp3" as const;

export function usePanicButton() {
  const [unit, setUnit] = React.useState<EmsFdDeputy | Officer | CombinedLeoUnit | null>(null);
  const { user } = useAuth();
  const [audio, , controls] = useAudio({
    autoPlay: false,
    src: PANIC_BUTTON_SRC,
  });

  const shouldPlayPanicButtonSound = user?.soundSettings?.panicButton ?? true;

  useListener(
    SocketEvents.PANIC_BUTTON_ON,
    (officer: Officer) => {
      setUnit(officer);
      controls.volume(0.3);
      controls.seek(0);
      shouldPlayPanicButtonSound && controls.play();
    },
    [shouldPlayPanicButtonSound, controls],
  );

  useListener(
    SocketEvents.PANIC_BUTTON_OFF,
    () => {
      setUnit(null);
      controls.pause();
    },
    [controls],
  );

  return { unit, audio, Component };
}

function Component({
  unit,
  audio,
}: {
  unit: Officer | EmsFdDeputy | CombinedLeoUnit | null;
  audio: any;
}) {
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  const callsignTemplate =
    unit && (isUnitCombined(unit) || isUnitCombinedEmsFd(unit))
      ? "pairedUnitTemplate"
      : "callsignTemplate";
  const callsign = unit && generateCallsign(unit, callsignTemplate);

  return (
    <>
      {audio}
      {unit ? (
        <div role="alert" className="p-2 px-3 my-2 font-semibold text-white bg-red-500 rounded-md">
          <p>
            {t("panicButtonLeo", {
              officer: `${callsign} ${makeUnitName(unit)}`,
            })}
          </p>
        </div>
      ) : null}
    </>
  );
}
