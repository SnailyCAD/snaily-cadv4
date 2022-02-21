import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import type { FullIncident } from "src/pages/officer/incidents";
import { useDispatchState } from "state/dispatchState";

export function useActiveIncidents() {
  const { activeIncidents, setActiveIncidents } = useDispatchState();

  useListener(
    { eventName: SocketEvents.UpdateActiveIncident, checkHasListeners: true },
    (incident: FullIncident) => {
      setActiveIncidents(
        activeIncidents.map((inc) => {
          if (inc.id === incident.id && incident.isActive) {
            return { ...inc, ...incident };
          }
          return inc;
        }),
      );
    },
    [activeIncidents, setActiveIncidents],
  );

  useListener(
    { eventName: SocketEvents.CreateActiveIncident, checkHasListeners: true },
    (incident: FullIncident) => {
      setActiveIncidents(
        activeIncidents.map((inc) => {
          if (inc.id !== incident.id && incident.isActive) {
            return incident;
          }

          return inc;
        }),
      );
    },
    [activeIncidents, setActiveIncidents],
  );

  return { activeIncidents, setActiveIncidents };
}
