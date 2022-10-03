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
  user: { username: string };
}

export function useTones(type: "leo" | "ems-fd") {
  const [leoAudio, , leoControls] = useAudio({ autoPlay: false, src: LEO_TONE_SRC });
  const [emsFdAudio, , emsFdControls] = useAudio({ autoPlay: false, src: EMS_FD_TONE_SRC });
  const [user, setUser] = React.useState<{ username: string } | null>(null);
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
        setUser(tonesData.user);
      } else {
        leoControls.pause();
      }

      if (tonesData.emsFdTone && type === "ems-fd") {
        emsFdControls.play();
        setUser(tonesData.user);
        setDescription({ description: tonesData.description, type: "ems-fd" });
      } else {
        emsFdControls.pause();
      }
    },
    [],
  );

  return { audio: [leoAudio, emsFdAudio], description, user, Component };
}

function Component({
  audio,
  description,
  user,
}: {
  audio: React.ReactElement[];
  description: { description: string | null; type: "leo" | "ems-fd" } | null;
  user: { username: string } | null;
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
          <footer className="text-base mt-3">
            <strong>{t("Common.user")}: </strong>
            <span>{user?.username}</span>
          </footer>
        </div>
      ) : null}
    </>
  );
}
