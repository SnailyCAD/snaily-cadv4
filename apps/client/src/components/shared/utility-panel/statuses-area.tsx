/* eslint-disable quotes */
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { classNames } from "lib/classNames";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import type { ActiveDeputy } from "state/ems-fd-state";
import type { ActiveOfficer } from "state/leo-state";
import { ModalIds } from "types/modal-ids";
import {
  type CombinedEmsFdUnit,
  type CombinedLeoUnit,
  type EmsFdDeputy,
  type Officer,
  ShouldDoType,
  WhatPages,
  type StatusValue,
  ValueType,
} from "@snailycad/types";
import { useAudio } from "react-use";
import { useAuth } from "context/AuthContext";
import type { PutDispatchStatusByUnitId } from "@snailycad/types/api";
import { useMounted } from "@casperiv/useful";
import Link from "next/link";
import { createValueDocumentationURL } from "src/pages/admin/values/[path]";

interface Props<T extends ActiveOfficer | ActiveDeputy> {
  initialData: T | null;
  activeUnit: T | null;
  units: T[];
  setActiveUnit(unit: T | null): void;
  setUnits(units: T[]): void;
}

const STATUS_UPDATE_SRC = "/sounds/status-update.mp3" as const;
export function StatusesArea<T extends ActiveOfficer | ActiveDeputy>({
  initialData,
  activeUnit: _activeUnit,
  units,
  setActiveUnit,
  setUnits,
}: Props<T>) {
  const isMounted = useMounted();
  const { codes10 } = useValues();
  const modalState = useModal();
  const { execute } = useFetch();
  const { user } = useAuth();
  const router = useRouter();
  const isEmsFd = router.pathname.includes("/ems-fd");
  const modalId = isEmsFd ? ModalIds.SelectDeputy : ModalIds.SelectOfficer;
  const updateEmsOrOfficerStatusEventName = isEmsFd
    ? SocketEvents.UpdateEmsFdStatus
    : SocketEvents.UpdateOfficerStatus;

  const whatPagesType = isEmsFd ? WhatPages.EMS_FD : WhatPages.LEO;
  const activeUnit = isMounted ? _activeUnit : initialData;

  const shouldPlayStatusUpdateSound = user?.soundSettings?.statusUpdate ?? false;
  const [audio, , controls] = useAudio({
    autoPlay: false,
    src: STATUS_UPDATE_SRC,
  });

  const isUnitOffDuty =
    !activeUnit ||
    activeUnit.status === null ||
    activeUnit.status.shouldDo === ShouldDoType.SET_OFF_DUTY;

  function handleOnDuty(onDutyCode: StatusValue | undefined) {
    if (isUnitOffDuty) {
      return modalState.openModal(modalId);
    }

    onDutyCode && handleStatusUpdate(onDutyCode);
  }

  function handlePlaySoundOnStatusChange(
    unit: Officer | EmsFdDeputy | CombinedLeoUnit | CombinedEmsFdUnit | null,
  ) {
    if (unit && shouldPlayStatusUpdateSound) {
      controls.seek(0);
      controls.play();
    } else {
      controls.pause();
    }
  }

  useListener(
    SocketEvents.UpdateUnitStatus,
    (data: Officer | EmsFdDeputy | CombinedLeoUnit | CombinedEmsFdUnit | null) => {
      if (activeUnit?.id === data?.id) {
        handlePlaySoundOnStatusChange(data);
      }
    },
    [activeUnit, updateEmsOrOfficerStatusEventName],
  );

  async function handleStatusUpdate(status: StatusValue) {
    if (!activeUnit) return;
    if (status.id === activeUnit.statusId) return;

    if (status.shouldDo === ShouldDoType.SET_OFF_DUTY) {
      setActiveUnit(null);
    } else {
      setActiveUnit({ ...activeUnit, statusId: status.id, status });
    }

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

    const { json } = await execute<PutDispatchStatusByUnitId>({
      path: `/dispatch/status/${activeUnit.id}`,
      method: "PUT",
      data: {
        status: status.id,
      },
    });

    if (json.id) {
      if (!json.status || json.status.shouldDo === ShouldDoType.SET_OFF_DUTY) {
        setActiveUnit(null);
      } else {
        setActiveUnit({ ...activeUnit, ...json });
      }
    }
  }

  const filteredCodes = codes10.values.filter((v) => handleWhatPagesFilter(v, whatPagesType));
  const onDutyCode = filteredCodes.find((v) => v.shouldDo === ShouldDoType.SET_ON_DUTY);
  const isOnDutyActive = !isUnitOffDuty && onDutyCode?.id === activeUnit.status?.id;
  const documentationUrl = createValueDocumentationURL(ValueType.CODES_10);

  if (!onDutyCode) {
    return (
      <Link
        target="_blank"
        href={documentationUrl}
        className="block mt-2 px-4 py-3 bg-gray-300/50 dark:bg-tertiary dark:border-t-[1.5px] dark:border-secondary text-blue-500 dark:text-blue-400 underline"
      >
        This SnailyCAD instance does not have a 10-code for setting a unit on duty. Please ask an
        admin to add one with the {`"Should Do"`} set to {`"Set On Duty"`}.
      </Link>
    );
  }

  if (filteredCodes.length <= 0) {
    return (
      <Link
        target="_blank"
        href={documentationUrl}
        className="block mt-2 px-4 py-3 bg-gray-300/50 dark:bg-tertiary dark:border-t-[1.5px] dark:border-secondary text-blue-500 dark:text-blue-400 underline"
      >
        This SnailyCAD instance does not have any 10 codes. Please ask an admin to add some.
      </Link>
    );
  }

  const departmentId = !isUnitOffDuty && "departmentId" in activeUnit && activeUnit.departmentId;

  return (
    <ul className="status-buttons-grid mt-2 px-4 py-2 bg-gray-300/50 dark:bg-tertiary dark:border-t-[1.5px] dark:border-secondary">
      {audio}
      <li>
        <Button
          className={classNames("w-full min-w-[5em] text-base", isOnDutyActive && "font-semibold")}
          variant={isOnDutyActive ? "blue" : "default"}
          onPress={() => handleOnDuty(onDutyCode)}
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
                onPress={() => handleStatusUpdate(code)}
                disabled={isUnitOffDuty}
                variant={variant}
                className={classNames("text-base w-full min-w-[5em]", isActive && "font-semibold")}
              >
                {code.value.value}
              </Button>
            </li>
          );
        })}
    </ul>
  );
}

export function handleWhatPagesFilter(status: StatusValue, whatPagesType: WhatPages) {
  if (status.whatPages.length <= 0) return true;
  return status.whatPages.includes(whatPagesType);
}
