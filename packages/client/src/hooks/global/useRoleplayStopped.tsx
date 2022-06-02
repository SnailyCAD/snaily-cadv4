import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useAudio } from "react-use";

const ROLEPLAY_STOPPED_SRC = "/sounds/roleplay-stopped.mp3";

export function useRoleplayStopped() {
  const { cad, user } = useAuth();
  const [roleplayStopped, setRoleplay] = React.useState<boolean>(false);

  const [audio, , controls] = useAudio({
    autoPlay: false,
    src: ROLEPLAY_STOPPED_SRC,
  });

  const shouldPlayRoleplayStoppedSound = user?.soundSettings?.stopRoleplay ?? false;

  useListener(
    SocketEvents.RoleplayStopped,
    (value: boolean) => {
      setRoleplay(!value);

      if (!value) {
        controls.volume(0.3);
        controls.seek(0);
        shouldPlayRoleplayStoppedSound && controls.play();
      } else {
        controls.pause();
      }
    },
    [controls, shouldPlayRoleplayStoppedSound],
  );

  React.useEffect(() => {
    if (cad?.miscCadSettings) {
      setRoleplay(!cad?.miscCadSettings?.roleplayEnabled);
    }
  }, [cad?.miscCadSettings]);

  return { roleplayStopped, audio, Component };
}

function Component({ audio, enabled }: { audio: React.ReactElement; enabled: boolean }) {
  const t = useTranslations("Common");

  return (
    <>
      {audio}

      {enabled ? (
        <div role="alert" className="p-2 px-4 my-2 mb-5 text-black rounded-md shadow bg-amber-500">
          <h1 className="text-xl font-bold">{t("stopRoleplay")}</h1>
          <p className="mt-1 text-lg">{t("roleplayStopped")}</p>
        </div>
      ) : null}
    </>
  );
}
