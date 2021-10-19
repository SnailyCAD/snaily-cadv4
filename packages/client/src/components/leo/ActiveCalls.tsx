import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import format from "date-fns/format";
import { useDispatchState } from "state/dispatchState";
import { ActiveOfficer } from "state/leoState";
import { Call911, Officer } from "types/prisma";
import { useTranslations } from "use-intl";

export const ActiveCalls = () => {
  const { calls, setCalls } = useDispatchState();
  const t = useTranslations("Calls");
  const common = useTranslations("Common");

  const makeUnit = (officer: Officer) =>
    `${officer.callsign} ${officer.name} ${
      "department" in officer ? `(${(officer as ActiveOfficer).department.value})` : ""
    }`;

  useListener(
    SocketEvents.Create911Call,
    (data) => {
      setCalls([data, ...calls]);
    },
    [calls, setCalls],
  );

  useListener(
    SocketEvents.End911Call,
    (data: Call911) => {
      setCalls(calls.filter((v) => v.id !== data.id));
    },
    [calls, setCalls],
  );

  useListener(
    SocketEvents.Update911Call,
    (call) => {
      setCalls(
        calls.map((v) => {
          if (v.id === call.id) {
            return call;
          }

          return v;
        }),
      );
    },
    [calls, setCalls],
  );

  return (
    <div className="bg-gray-200/80 rounded-md overflow-hidden">
      <header className="bg-gray-300/50 px-4 p-2">
        <h3 className="text-xl font-semibold">{t("active911Calls")}</h3>
      </header>

      <div className="px-4">
        {calls.length <= 0 ? (
          <p className="py-2">{t("no911Calls")}</p>
        ) : (
          <div className="overflow-x-auto w-full  max-h-80 mt-3">
            <table className="overflow-hidden w-full whitespace-nowrap">
              <thead className="sticky top-0">
                <tr>
                  <th className="bg-gray-300">{t("caller")}</th>
                  <th className="bg-gray-300">{t("location")}</th>
                  <th className="bg-gray-300">{t("description")}</th>
                  <th className="bg-gray-300">{common("createdAt")}</th>
                  <th className="bg-gray-300">{t("assignedUnits")}</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td>{call.name}</td>
                    <td>{call.location}</td>
                    <td>{call.description}</td>
                    <td>{format(new Date(call.createdAt), "HH:mm:ss - yyyy-MM-dd")}</td>
                    <td>{call.assignedUnits.map(makeUnit).join(", ")}</td>
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
