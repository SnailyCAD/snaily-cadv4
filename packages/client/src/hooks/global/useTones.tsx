import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useAudio } from "react-use";

const LEO_TONE_SRC = "/sounds/leo-tone.mp3";
const EMS_FD_TONE_SRC = "/sounds/ems-fd-tone.mp3";

interface TonesData {
  leoTone: boolean;
  emsFdTone: boolean;
  description: string | null;
}

export function useTones(type: "leo" | "ems-fd") {
  const [leoAudio, , leoControls] = useAudio({ autoPlay: false, src: LEO_TONE_SRC });
  const [emsFdAudio, , emsFdControls] = useAudio({ autoPlay: false, src: EMS_FD_TONE_SRC });
  const [description, setDescription] = React.useState<string | null>(null);

  useListener(
    SocketEvents.Tones,
    (tonesData: TonesData) => {
      if (tonesData.leoTone && type === "leo") {
        leoControls.play();
      } else {
        leoControls.pause();
      }

      if (tonesData.emsFdTone && type === "ems-fd") {
        emsFdControls.play();
      } else {
        emsFdControls.pause();
      }

      setDescription(tonesData.description ?? null);
    },
    [],
  );

  return { audio: [leoAudio, emsFdAudio], description, Component };
}

function Component({
  audio,
  description,
}: {
  audio: React.ReactElement[];
  description: string | null;
}) {
  const t = useTranslations();

  return (
    <>
      {audio.map((v, idx) => (
        <React.Fragment key={idx}>{v}</React.Fragment>
      ))}

      {description ? (
        <div role="alert" className="p-2 px-4 my-2 mb-5 text-black rounded-md shadow bg-amber-400">
          <h1 className="text-xl font-bold">{t("Leo.toneNotification")}</h1>
          <p className="mt-1 text-lg">{description}</p>
        </div>
      ) : null}
    </>
  );
}
