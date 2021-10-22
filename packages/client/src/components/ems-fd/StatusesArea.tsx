import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { useAuth } from "context/AuthContext";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import { useEmsFdState } from "state/emsFdState";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType, StatusEnum, StatusValue } from "types/prisma";

export const StatusesArea = () => {
  const { codes10 } = useValues();
  const { cad } = useAuth();
  const { activeDeputy, setActiveDeputy } = useEmsFdState();
  const { openModal } = useModal();
  const { execute } = useFetch();

  async function getActiveDeputy() {
    const { json, error } = await execute("/ems-fd/active-deputy", {
      noToast: true,
    });

    if (json.id) {
      setActiveDeputy({ ...activeDeputy, ...json });
    }

    if (error && error === "noActiveDeputy") {
      setActiveDeputy(null);
    }
  }

  useListener(
    SocketEvents.UpdateEmsFdStatus,
    () => {
      getActiveDeputy();
    },
    [setActiveDeputy, activeDeputy],
  );

  const isButtonDisabled =
    !activeDeputy || activeDeputy.status === StatusEnum.OFF_DUTY || activeDeputy.status2 === null;

  async function handleStatusUpdate(status: StatusValue) {
    if (!activeDeputy) return;
    if (status.id === activeDeputy?.status2Id) return;

    const { json } = await execute(`/ems-fd/${activeDeputy.id}/status`, {
      method: "PUT",
      data: {
        status:
          status.shouldDo === ShouldDoType.SET_OFF_DUTY ? StatusEnum.OFF_DUTY : StatusEnum.ON_DUTY,
        status2: status.value.value,
      },
    });

    if (json.id) {
      setActiveDeputy({ ...activeDeputy, ...json });
    }
  }

  const onDutyCode = codes10.values.find((v) => v.value.value === cad?.miscCadSettings?.onDutyCode);
  const isOnDutyActive =
    !isButtonDisabled && onDutyCode?.valueId === activeDeputy?.status2?.valueId;

  return (
    <ul className="status-buttons-grid mt-2 px-4 py-2 bg-gray-300/50">
      <li>
        <Button
          className={
            isOnDutyActive ? "bg-blue-500 hover:bg-blue-600 w-full font-semibold" : "w-full"
          }
          onClick={() => openModal(ModalIds.SelectDeputy)}
        >
          {cad?.miscCadSettings.onDutyCode ?? "10-8"}
        </Button>
      </li>

      {codes10.values
        .filter((v) => v.value.value !== cad?.miscCadSettings.onDutyCode)
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((code) => {
          const variant = code.shouldDo === ShouldDoType.SET_OFF_DUTY ? "danger" : "default";
          const isActive = code.valueId === activeDeputy?.status2?.valueId;

          return (
            <li key={code.id}>
              <Button
                onClick={() => handleStatusUpdate(code)}
                disabled={isButtonDisabled}
                variant={variant}
                className={
                  isActive ? "bg-blue-500 hover:bg-blue-600 w-full font-semibold" : "w-full"
                }
              >
                {code.value.value}
              </Button>
            </li>
          );
        })}
    </ul>
  );
};
