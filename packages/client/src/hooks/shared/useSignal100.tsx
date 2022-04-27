import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useAudio } from "react-use";

const SIGNAL_100_SRC = "/sounds/signal100.mp3";
export function useSignal100() {
  const { cad } = useAuth();
  const [signal100Enabled, setSign100] = React.useState<boolean>(
    cad?.miscCadSettings?.signal100Enabled ?? false,
  );

  const { user } = useAuth();
  const [audio, , controls] = useAudio({
    autoPlay: false,
    src: SIGNAL_100_SRC,
  });

  const shouldPlaySignal100 = user?.soundSettings?.signal100 ?? true;

  useListener(
    SocketEvents.Signal100,
    (value: boolean) => {
      setSign100(value);
      if (value) {
        controls.volume(0.3);
        controls.seek(0);
        shouldPlaySignal100 && controls.play();
      } else {
        controls.pause();
      }
    },
    [shouldPlaySignal100, controls],
  );

  React.useEffect(() => {
    setSign100(cad?.miscCadSettings?.signal100Enabled ?? false);
  }, [cad?.miscCadSettings?.signal100Enabled]);

  return { signal100Enabled, audio, Component };
}

function Component({ audio, enabled }: { audio: any; enabled: boolean }) {
  const t = useTranslations("Leo");

  return (
    <>
      {audio}

      {enabled ? (
        <div role="alert" className="p-2 px-3 my-2 font-semibold text-white bg-red-500 rounded-md">
          <p>{t("signal100enabled")}</p>
        </div>
      ) : null}
    </>
  );
}
