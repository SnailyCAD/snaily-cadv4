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
import { ShouldDoType, WhatPages, type StatusValue } from "@snailycad/types";

interface Props<T extends ActiveOfficer | ActiveDeputy> {
  activeUnit: T | null;
  units: T[];
  setActiveUnit(unit: T | null): void;
  setUnits(units: T[]): void;
}

export function StatusesArea<T extends ActiveOfficer | ActiveDeputy>({
  activeUnit,
  units,
  setActiveUnit,
  setUnits,
}: Props<T>) {
  const { codes10 } = useValues();
  const { openModal } = useModal();
  const { execute } = useFetch();
  const router = useRouter();
  const isEmsFd = router.pathname.includes("/ems-fd");
  const modalId = isEmsFd ? ModalIds.SelectDeputy : ModalIds.SelectOfficer;
  const socketEvent = isEmsFd ? SocketEvents.UpdateEmsFdStatus : SocketEvents.UpdateOfficerStatus;
  const whatPagesType = isEmsFd ? WhatPages.EMS_FD : WhatPages.LEO;

  const isUnitOffDuty =
    !activeUnit ||
    activeUnit.status === null ||
    activeUnit.status.shouldDo === ShouldDoType.SET_OFF_DUTY;

  function handleOnDuty(onDutyCode: StatusValue | undefined) {
    if (isUnitOffDuty) {
      return openModal(modalId);
    }

    onDutyCode && handleStatusUpdate(onDutyCode);
  }

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

    setActiveUnit({ ...activeUnit, statusId: status.id, status });

    if (status.shouldDo === ShouldDoType.SET_OFF_DUTY) {
      setUnits(units.filter((v) => v.id !== activeUnit.id));
    } else {
      setUnits(
        units.map((unit) => {
          if (unit.id === activeUnit.id) {
            return { ...unit, statusId: status.id, status };
          }
          return unit;
        }),
      );
    }

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

  const filteredCodes = codes10.values.filter((v) => handleWhatPagesFilter(v, whatPagesType));
  const onDutyCode = filteredCodes.find((v) => v.shouldDo === ShouldDoType.SET_ON_DUTY);
  const isOnDutyActive = !isUnitOffDuty && onDutyCode?.id === activeUnit?.status?.id;

  if (!onDutyCode && filteredCodes.length <= 0) {
    return (
      <div className="text-lg mt-2 px-4 py-3 bg-gray-300/50 dark:bg-gray-2 dark:border-t-[1.5px] dark:border-gray-3">
        This CAD does not have any 10 codes. Please ask an admin to add some.
      </div>
    );
  }

  const departmentId = !isUnitOffDuty && "departmentId" in activeUnit && activeUnit.departmentId;

  return (
    <ul className="status-buttons-grid mt-2 px-4 py-2 bg-gray-300/50 dark:bg-gray-2 dark:border-t-[1.5px] dark:border-gray-3">
      <li>
        <Button
          className={classNames("w-full min-w-[5em]", isOnDutyActive && "font-semibold")}
          variant={isOnDutyActive ? "blue" : "default"}
          onClick={() => handleOnDuty(onDutyCode)}
        >
          {onDutyCode?.value.value}
        </Button>
      </li>

      {filteredCodes
        .filter((v) => v.shouldDo !== ShouldDoType.SET_ON_DUTY && v.type === "STATUS_CODE")
        .sort((a, b) => Number(a.value.position) - Number(b.value.position))
        .map((code) => {
          const isActive = code.id === activeUnit?.statusId;
          const variant =
            code.shouldDo === ShouldDoType.SET_OFF_DUTY ? "danger" : isActive ? "blue" : "default";

          const checkDepartments = departmentId && (code.departments ?? []).length > 0;
          if (checkDepartments && !code.departments?.some((v) => v.id === departmentId)) {
            return null;
          }

          return (
            <li key={code.id}>
              <Button
                onClick={() => handleStatusUpdate(code)}
                disabled={isUnitOffDuty}
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

function handleWhatPagesFilter(status: StatusValue, whatPagesType: WhatPages) {
  if (status.whatPages.length <= 0) return true;
  return status.whatPages.includes(whatPagesType);
}
