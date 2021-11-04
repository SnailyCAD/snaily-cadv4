import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { classNames } from "lib/classNames";
import useFetch from "lib/useFetch";
import { useEmsFdState } from "state/emsFdState";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType, StatusValue } from "types/prisma";

export const StatusesArea = () => {
  const { codes10 } = useValues();
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
    !activeDeputy ||
    activeDeputy.status === null ||
    activeDeputy.status.shouldDo === ShouldDoType.SET_OFF_DUTY;

  async function handleStatusUpdate(status: StatusValue) {
    if (!activeDeputy) return;
    if (status.id === activeDeputy?.statusId) return;

    const { json } = await execute(`/ems-fd/${activeDeputy.id}/status`, {
      method: "PUT",
      data: {
        status: status.id,
      },
    });

    if (json.id) {
      setActiveDeputy({ ...activeDeputy, ...json });
    }
  }

  const onDutyCode = codes10.values.find((v) => v.shouldDo === ShouldDoType.SET_ON_DUTY);
  const isOnDutyActive = !isButtonDisabled && onDutyCode?.id === activeDeputy?.status?.id;

  return (
    <ul className="status-buttons-grid mt-2 px-4 py-2 bg-gray-300/50 dark:bg-gray-2 dark:border-t-[1.5px] dark:border-gray-3">
      <li>
        <Button
          className={classNames("w-full min-w-[5em]", isOnDutyActive && "font-semibold")}
          variant={isOnDutyActive ? "blue" : "default"}
          onClick={() => openModal(ModalIds.SelectDeputy)}
        >
          {onDutyCode?.value.value}
        </Button>
      </li>

      {codes10.values
        .filter((v) => v.shouldDo !== ShouldDoType.SET_ON_DUTY)
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((code) => {
          const isActive = code.id === activeDeputy?.statusId;
          const variant =
            code.shouldDo === ShouldDoType.SET_OFF_DUTY ? "danger" : isActive ? "blue" : "default";

          return (
            <li key={code.id}>
              <Button
                onClick={() => handleStatusUpdate(code)}
                disabled={isButtonDisabled}
                variant={variant}
                className={classNames("w-full min-w-[5em]", isActive && "font-semibold")}
              >
                {code.value.value}
              </Button>
            </li>
          );
        })}
    </ul>
  );
};
