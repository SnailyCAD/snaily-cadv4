import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useAudio } from "react-use";
import { useCall911State } from "state/dispatch/call-911-state";
import { Alert } from "@snailycad/ui";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

const useSignal100Store = createWithEqualityFn<{
  playCount: number;
  setPlayCount(value: number): void;
}>()(
  (set) => ({
    playCount: 0,
    setPlayCount: (value: number) => set({ playCount: value }),
  }),
  shallow,
);

const SIGNAL_100_SRC = "/sounds/signal100.mp3";
export function useSignal100() {
  const { cad, user } = useAuth();
  const { playCount, setPlayCount } = useSignal100Store();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const miscCadSettings = cad?.miscCadSettings ?? {
    signal100Enabled: false,
    signal100RepeatAmount: 1,
    signal100RepeatIntervalMs: 1000,
  };

  const signal100Enabled = miscCadSettings.signal100Enabled ?? false;
  const signal100RepeatAmount = miscCadSettings.signal100RepeatAmount ?? 1;
  const signal100RepeatIntervalMs = miscCadSettings.signal100RepeatIntervalMs ?? 1000;
  const shouldPlaySignal100 = user?.soundSettings?.signal100 ?? true;

  const [isSignal100Enabled, setSignal100] = React.useState<boolean>(signal100Enabled);
  const [audio, , controls] = useAudio({
    autoPlay: false,
    src: SIGNAL_100_SRC,
    onEnded() {
      setPlayCount(playCount + 1);

      if (playCount <= signal100RepeatAmount) {
        // wait for the possible interval ms
        timeoutRef.current = setTimeout(() => {
          controls.seek(0);
          controls.play();
        }, signal100RepeatIntervalMs);
      }
    },
  });

  useListener(
    SocketEvents.Signal100,
    (value: boolean) => {
      setSignal100(value);
      setPlayCount(0);

      if (value) {
        controls.volume(0.3);
        controls.seek(0);
        shouldPlaySignal100 && controls.play();
      } else {
        controls.pause();
        timeoutRef.current && clearTimeout(timeoutRef.current);
      }
    },
    [shouldPlaySignal100, controls],
  );

  return { enabled: isSignal100Enabled, audio, Component };
}

function Component({ audio, enabled }: { audio: any; enabled: boolean }) {
  const t = useTranslations("Leo");
  const calls = useCall911State((state) => state.calls);

  const callsWithSignal100 = React.useMemo(
    () =>
      calls
        .filter((call) => call.isSignal100)
        .map((call) => `#${call.caseNumber}`)
        .join(", "),
    [calls],
  );

  return (
    <>
      {audio}

      {enabled ? (
        <Alert
          className="my-2 font-semibold"
          message={
            <>
              {t("signal100enabled")}{" "}
              {callsWithSignal100.length > 0 ? `(${callsWithSignal100})` : null}
            </>
          }
          type="error"
        />
      ) : null}
    </>
  );
}
