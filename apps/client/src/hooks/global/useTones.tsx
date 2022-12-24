import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useAudio } from "react-use";
import { useRouter } from "next/router";
import { ActiveTone, ActiveToneType } from "@snailycad/types";

const LEO_TONE_SRC = "/sounds/leo-tone.mp3";
const EMS_FD_TONE_SRC = "/sounds/ems-fd-tone.mp3";

export function useTones(type: "leo" | "ems-fd") {
  const [leoAudio, , leoControls] = useAudio({ autoPlay: false, src: LEO_TONE_SRC });
  const [emsFdAudio, , emsFdControls] = useAudio({ autoPlay: false, src: EMS_FD_TONE_SRC });
  const [user, setUser] = React.useState<{ username: string } | null>(null);
  const [description, setDescription] = React.useState<{
    type: ActiveToneType;
    description: string | null;
  } | null>(null);

  useListener(
    SocketEvents.Tones,
    (tonesData: ActiveTone) => {
      const isShared = tonesData.type === ActiveToneType.SHARED;

      if (isShared) {
        leoControls.play();
        emsFdControls.play();

        setDescription({ description: tonesData.description, type: tonesData.type });
        setUser(tonesData.createdBy);
      } else {
        leoControls.pause();
        emsFdControls.pause();
      }

      if (isShared || (tonesData.type === ActiveToneType.LEO && type === "leo")) {
        leoControls.play();
        setDescription({ description: tonesData.description, type: tonesData.type });
        setUser(tonesData.createdBy);
      } else {
        leoControls.pause();
      }

      if (isShared || (tonesData.type === ActiveToneType.EMS_FD && type === "ems-fd")) {
        emsFdControls.play();
        setUser(tonesData.createdBy);
        setDescription({ description: tonesData.description, type: tonesData.type });
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
  description: { description: string; type: ActiveToneType } | null;
  user: { username: string } | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const types: Record<string, ActiveToneType> = {
    "/officer": ActiveToneType.LEO,
    "/ems-fd": ActiveToneType.EMS_FD,
  };

  const type = types[router.pathname];
  const isShared = description?.type === ActiveToneType.SHARED;
  const showToneMessage = isShared ? true : description?.type === type;

  if (!description) {
    return null;
  }

  return (
    <>
      {audio.map((v, idx) => (
        <React.Fragment key={idx}>{v}</React.Fragment>
      ))}

      {showToneMessage ? (
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
