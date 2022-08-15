import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useAuth } from "context/AuthContext";
import { useAudio } from "react-use";
import { useCall911State } from "state/dispatch/call911State";
import type { Full911Call } from "state/dispatch/dispatchState";
import type { ActiveDeputy } from "state/emsFdState";
import type { ActiveOfficer } from "state/leoState";

interface UseActiveCallsOptions {
  calls: Full911Call[];
  unit: ActiveDeputy | ActiveOfficer | null;
}

const ADDED_TO_CALL_SRC = "/sounds/added-to-call.mp3" as const;
const INCOMING_CALL_SRC = "/sounds/incoming-call.mp3" as const;

export function useActiveCalls({ unit, calls }: UseActiveCallsOptions) {
  const call911State = useCall911State();
  const { user } = useAuth();

  const shouldPlayAddedToCallSound = user?.soundSettings?.addedToCall ?? false;
  const shouldPlayIncomingCallSound = user?.soundSettings?.incomingCall ?? false;

  const [addedToCallAudio, , addedToCallControls] = useAudio({
    autoPlay: false,
    src: ADDED_TO_CALL_SRC,
  });

  const [incomingCallAudio, , incomingCallControls] = useAudio({
    autoPlay: false,
    src: INCOMING_CALL_SRC,
  });

  useListener(
    SocketEvents.Create911Call,
    (call: Full911Call | null) => {
      if (!call) return;
      if (calls.some((v) => v.id === call.id)) return;

      const wasAssignedToCall = call.assignedUnits.some((v) => v.unit?.id === unit?.id);

      if (shouldPlayIncomingCallSound) {
        incomingCallControls.seek(0);
        incomingCallControls.volume(0.3);
        incomingCallControls.play();
      }

      if (wasAssignedToCall && shouldPlayAddedToCallSound) {
        addedToCallControls.seek(0);
        addedToCallControls.volume(0.3);
        addedToCallControls.play();
      }

      call911State.setCalls([call, ...calls]);
    },
    [
      calls,
      shouldPlayAddedToCallSound,
      shouldPlayIncomingCallSound,
      addedToCallControls,
      incomingCallControls,
      unit?.id,
    ],
  );

  useListener(
    SocketEvents.End911Call,
    (data: Full911Call | undefined) => {
      if (!data) return;
      call911State.setCalls(calls.filter((v) => v.id !== data.id));
    },
    [calls, call911State.setCalls],
  );

  useListener(
    SocketEvents.Update911Call,
    (call: Full911Call | undefined) => {
      if (!call) return;

      const prevCall = calls.find((v) => v.id === call.id);
      if (prevCall) {
        const wasAssignedToCall =
          !prevCall.assignedUnits.some((u) => u.unit?.id === unit?.id) &&
          call.assignedUnits.some((v) => v.unit?.id === unit?.id);

        if (wasAssignedToCall && shouldPlayAddedToCallSound) {
          addedToCallControls.seek(0);
          addedToCallControls.volume(0.3);
          addedToCallControls.play();
        } else {
          addedToCallControls.pause();
        }
      }

      call911State.setCalls(
        calls.map((v) => {
          if (v.id === call.id) {
            if (call911State.currentlySelectedCall?.id === call.id) {
              call911State.setCurrentlySelectedCall({ ...v, ...call });
            }

            return { ...v, ...call };
          }

          return v;
        }),
      );
    },
    [calls, unit?.id, addedToCallControls, shouldPlayAddedToCallSound, call911State.setCalls],
  );

  return {
    audio: {
      addedToCallAudio,
      incomingCallAudio,
    },
  };
}
