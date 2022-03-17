import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import type { FullIncident } from "src/pages/officer/incidents";
import { useDispatchState } from "state/dispatchState";

export function useActiveIncidents() {
  const { activeIncidents, setActiveIncidents } = useDispatchState();

  useListener(
    { eventName: SocketEvents.UpdateActiveIncident, checkHasListeners: true },
    (incident: FullIncident) => {
      if (incident.isActive) {
        setActiveIncidents(
          activeIncidents.map((inc) => {
            if (inc.id === incident.id && incident.isActive) {
              return { ...inc, ...incident };
            }
            return inc;
          }),
        );
      } else {
        setActiveIncidents(activeIncidents.filter((v) => v.id !== incident.id));
      }
    },
    [activeIncidents, setActiveIncidents],
  );

  useListener(
    { eventName: SocketEvents.CreateActiveIncident, checkHasListeners: true },
    (incident: FullIncident) => {
      const alreadyExists = activeIncidents.some((v) => v.id === incident.id);

      if (!alreadyExists && incident.isActive) {
        setActiveIncidents([incident, ...activeIncidents]);
      }
    },
    [activeIncidents, setActiveIncidents],
  );

  return { activeIncidents, setActiveIncidents };
}
