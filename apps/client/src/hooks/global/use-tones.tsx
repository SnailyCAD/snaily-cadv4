import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";
import { useAudio } from "react-use";
import { useRouter } from "next/router";
import { ActiveTone, ActiveToneType } from "@snailycad/types";
import { useQuery } from "@tanstack/react-query";
import type { GETDispatchTonesData } from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

const LEO_TONE_SRC = "/sounds/leo-tone.mp3";
const EMS_FD_TONE_SRC = "/sounds/ems-fd-tone.mp3";

export function useGetActiveTone(type?: ActiveToneType) {
  const { TONES } = useFeatureEnabled();
  const { execute } = useFetch();

  const { data } = useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!TONES,
    queryKey: ["active-tones", type],
    queryFn: async () => {
      const { json } = await execute<GETDispatchTonesData>({
        path: "/dispatch/tones",
        method: "GET",
      });

      if (Array.isArray(json)) {
        return json;
      }

      return [];
    },
  });

  const activeTone =
    data?.find((v) => v.type === ActiveToneType.SHARED) ?? data?.find((v) => v.type === type);

  return { activeTone: activeTone ?? null, activeTones: data ?? [] };
}

export function useTones(type: ActiveToneType) {
  const initialActiveTone = useGetActiveTone(type);

  const [leoAudio, , leoControls] = useAudio({ autoPlay: false, src: LEO_TONE_SRC });
  const [emsFdAudio, , emsFdControls] = useAudio({ autoPlay: false, src: EMS_FD_TONE_SRC });
  const [user, setUser] = React.useState<{ username: string } | null>(
    initialActiveTone.activeTone?.createdBy ?? null,
  );
  const [description, setDescription] = React.useState<{
    type: ActiveToneType;
    description: string | null;
  } | null>(initialActiveTone.activeTone);

  React.useEffect(() => {
    setDescription(initialActiveTone.activeTone);
    setUser(initialActiveTone.activeTone?.createdBy ?? null);
  }, [initialActiveTone.activeTone]);

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

      if (isShared || (tonesData.type === ActiveToneType.LEO && type === ActiveToneType.LEO)) {
        leoControls.play();
        setDescription({ description: tonesData.description, type: tonesData.type });
        setUser(tonesData.createdBy);
      } else {
        leoControls.pause();
      }

      if (
        isShared ||
        (tonesData.type === ActiveToneType.EMS_FD && type === ActiveToneType.EMS_FD)
      ) {
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
  description: { description: string | null; type: ActiveToneType } | null;
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

  return (
    <>
      {audio.map((v, idx) => (
        <React.Fragment key={idx}>{v}</React.Fragment>
      ))}

      {showToneMessage && description?.description ? (
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
