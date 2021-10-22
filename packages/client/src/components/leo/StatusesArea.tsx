import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { useAuth } from "context/AuthContext";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { classNames } from "lib/classNames";
import useFetch from "lib/useFetch";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType, StatusEnum, StatusValue } from "types/prisma";

export const StatusesArea = () => {
  const { codes10 } = useValues();
  const { cad } = useAuth();
  const { activeOfficer, setActiveOfficer } = useLeoState();
  const { openModal } = useModal();
  const { execute } = useFetch();

  async function getActiveOfficer() {
    const { json, error } = await execute("/leo/active-officer", {
      noToast: true,
    });

    if (json.id) {
      setActiveOfficer({ ...activeOfficer, ...json });
    }

    if (error && error === "noActiveOfficer") {
      setActiveOfficer(null);
    }
  }

  useListener(
    SocketEvents.UpdateOfficerStatus,
    () => {
      getActiveOfficer();
    },
    [setActiveOfficer, activeOfficer],
  );

  const isButtonDisabled =
    !activeOfficer ||
    activeOfficer.status === StatusEnum.OFF_DUTY ||
    activeOfficer.status2 === null;

  async function handleStatusUpdate(status: StatusValue) {
    if (!activeOfficer) return;
    if (status.id === activeOfficer?.status2Id) return;

    const { json } = await execute(`/leo/${activeOfficer.id}/status`, {
      method: "PUT",
      data: {
        status:
          status.shouldDo === ShouldDoType.SET_OFF_DUTY ? StatusEnum.OFF_DUTY : StatusEnum.ON_DUTY,
        status2: status.value.value,
      },
    });

    if (json.id) {
      setActiveOfficer({ ...activeOfficer, ...json });
    }
  }

  const onDutyCode = codes10.values.find((v) => v.value.value === cad?.miscCadSettings?.onDutyCode);
  const isOnDutyActive =
    !isButtonDisabled && onDutyCode?.valueId === activeOfficer?.status2?.valueId;

  return (
    <ul className="status-buttons-grid mt-2 px-4 py-2 bg-gray-300/50">
      <li>
        <Button
          className={classNames(
            "w-full min-w-[5em]",
            isOnDutyActive && "bg-blue-500 hover:bg-blue-600 font-semibold",
          )}
          onClick={() => openModal(ModalIds.SelectOfficer)}
        >
          {cad?.miscCadSettings.onDutyCode ?? "10-8"}
        </Button>
      </li>

      {codes10.values
        .filter((v) => v.value.value !== cad?.miscCadSettings.onDutyCode)
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((code) => {
          const variant = code.shouldDo === ShouldDoType.SET_OFF_DUTY ? "danger" : "default";
          const isActive = code.valueId === activeOfficer?.status2?.valueId;

          return (
            <li key={code.id}>
              <Button
                onClick={() => handleStatusUpdate(code)}
                disabled={isButtonDisabled}
                variant={variant}
                className={classNames(
                  "w-full min-w-[5em]",
                  isActive && "bg-blue-500 hover:bg-blue-600 font-semibold",
                )}
              >
                {code.value.value}
              </Button>
            </li>
          );
        })}
    </ul>
  );
};
