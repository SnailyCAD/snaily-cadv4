import { Button } from "components/Button";
import { useAuth } from "context/AuthContext";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
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

  return (
    <ul className="flex space-x-3 mt-2 pt-2 border-t-[1.5px] border-gray-400">
      <li>
        <Button onClick={() => openModal(ModalIds.SelectOfficer)}>
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
                className={isActive ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                {code.value.value}
              </Button>
            </li>
          );
        })}
    </ul>
  );
};
