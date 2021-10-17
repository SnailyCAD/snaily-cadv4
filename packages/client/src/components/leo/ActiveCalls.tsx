import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useDispatchState } from "state/dispatchState";

export const ActiveCalls = () => {
  const { calls, setCalls } = useDispatchState();

  useListener(
    SocketEvents.Create911Call,
    (data) => {
      setCalls([data, ...calls]);
    },
    [calls, setCalls],
  );

  return (
    <div className="bg-gray-200/80 rounded-md overflow-hidden">
      <header className="bg-gray-300/50 px-4 p-2">
        <h3 className="text-xl font-semibold">{"Active 911 Calls"}</h3>
      </header>

      <div className="px-4">
        {calls.length <= 0 ? (
          <p>{"There are no active calls."}</p>
        ) : (
          <div className="overflow-x-auto w-full  max-h-80 mt-3">
            <table className="overflow-hidden w-full whitespace-nowrap">
              <thead className="sticky top-0">
                <tr>
                  <th className="bg-gray-300">{"caller"}</th>
                  <th className="bg-gray-300">{"location"}</th>
                  <th className="bg-gray-300">{"description"}</th>
                  <th className="bg-gray-300">{"assignedUnits"}</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td>{call.name}</td>
                    <td>{call.location}</td>
                    <td>{call.description}</td>
                    <td>{call.assignedUnits.map((unit) => unit.name).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
