import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useAudio } from "react-use";
import { useRouter } from "next/router";

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
  const [description, setDescription] = React.useState<{
    type: "leo" | "ems-fd";
    description: string | null;
  } | null>(null);

  useListener(
    SocketEvents.Tones,
    (tonesData: TonesData) => {
      if (tonesData.leoTone && type === "leo") {
        leoControls.play();
        setDescription({ description: tonesData.description, type: "leo" });
      } else {
        leoControls.pause();
      }

      if (tonesData.emsFdTone && type === "ems-fd") {
        emsFdControls.play();
        setDescription({ description: tonesData.description, type: "ems-fd" });
      } else {
        emsFdControls.pause();
      }
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
  description: { description: string | null; type: "leo" | "ems-fd" } | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const types: Record<string, "leo" | "ems-fd"> = {
    "/officer": "leo",
    "/ems-fd": "ems-fd",
  };
  const type = types[router.pathname];

  return (
    <>
      {audio.map((v, idx) => (
        <React.Fragment key={idx}>{v}</React.Fragment>
      ))}

      {description?.description && description.type === type ? (
        <div role="alert" className="p-2 px-4 my-2 mb-5 text-black rounded-md shadow bg-amber-400">
          <h1 className="text-xl font-bold">{t("Leo.toneNotification")}</h1>
          <p className="mt-1 text-lg">{description.description}</p>
        </div>
      ) : null}
    </>
  );
}
