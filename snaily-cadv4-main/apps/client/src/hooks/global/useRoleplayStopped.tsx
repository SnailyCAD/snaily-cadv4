import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useAudio } from "react-use";
import { Alert } from "@snailycad/ui";

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
        <Alert
          className="my-2"
          title={t("stopRoleplay")}
          message={t("roleplayStopped")}
          type="warning"
        />
      ) : null}
    </>
  );
}
