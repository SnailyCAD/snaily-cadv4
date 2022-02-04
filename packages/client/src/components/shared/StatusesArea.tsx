import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { classNames } from "lib/classNames";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import type { ActiveDeputy } from "state/emsFdState";
import type { ActiveOfficer } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { ShouldDoType, StatusValue } from "@snailycad/types";

interface Props {
  activeUnit: ActiveOfficer | ActiveDeputy | null;
  setActiveUnit(unit: ActiveOfficer | ActiveDeputy | null): void;
}

export function StatusesArea({ activeUnit, setActiveUnit }: Props) {
  const { codes10 } = useValues();
  const { openModal } = useModal();
  const { execute } = useFetch();
  const router = useRouter();
  const isEmsFd = router.pathname.includes("/ems-fd");
  const modalId = isEmsFd ? ModalIds.SelectDeputy : ModalIds.SelectOfficer;
  const socketEvent = isEmsFd ? SocketEvents.UpdateEmsFdStatus : SocketEvents.UpdateOfficerStatus;

  async function getActiveUnit() {
    const path = isEmsFd ? "/ems-fd/active-deputy" : "/leo/active-officer";
    const { json, error } = await execute(path, { noToast: true });

    if (json.id) {
      setActiveUnit({ ...activeUnit, ...json });
    }

    if (error && error === "noActiveOfficer") {
      setActiveUnit(null);
    }
  }

  useListener(
    socketEvent,
    () => {
      getActiveUnit();
    },
    [setActiveUnit, activeUnit],
  );

  async function handleStatusUpdate(status: StatusValue) {
    if (!activeUnit) return;
    if (status.id === activeUnit.statusId) return;

    const { json } = await execute(`/dispatch/status/${activeUnit.id}`, {
      method: "PUT",
      data: {
        status: status.id,
      },
    });

    if (json.id) {
      setActiveUnit({ ...activeUnit, ...json });
    }
  }

  const isButtonDisabled =
    !activeUnit ||
    activeUnit.status === null ||
    activeUnit.status.shouldDo === ShouldDoType.SET_OFF_DUTY;

  const onDutyCode = codes10.values.find((v) => v.shouldDo === ShouldDoType.SET_ON_DUTY);
  const isOnDutyActive = !isButtonDisabled && onDutyCode?.id === activeUnit?.status?.id;

  if (!onDutyCode && codes10.values.length <= 0) {
    return (
      <div className="text-lg mt-2 px-4 py-3 bg-gray-300/50 dark:bg-gray-2 dark:border-t-[1.5px] dark:border-gray-3">
        This CAD does not have any 10 codes. Please ask an admin to add some.
      </div>
    );
  }

  return (
    <ul className="status-buttons-grid mt-2 px-4 py-2 bg-gray-300/50 dark:bg-gray-2 dark:border-t-[1.5px] dark:border-gray-3">
      <li>
        <Button
          className={classNames("w-full min-w-[5em]", isOnDutyActive && "font-semibold")}
          variant={isOnDutyActive ? "blue" : "default"}
          onClick={() => openModal(modalId)}
        >
          {onDutyCode?.value.value}
        </Button>
      </li>

      {codes10.values
        .filter((v) => v.shouldDo !== ShouldDoType.SET_ON_DUTY && v.type === "STATUS_CODE")
        .sort((a, b) => Number(a.value.position) - Number(b.value.position))
        .map((code) => {
          const isActive = code.id === activeUnit?.statusId;
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
}
