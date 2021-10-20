import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { Loader } from "components/Loader";
import { ActiveOfficer } from "state/leoState";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useDispatchState } from "state/dispatchState";

export const ActiveOfficersModal = () => {
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const [officers, setOfficers] = React.useState<ActiveOfficer[]>([]);
  const t = useTranslations("Leo");
  const setActiveOfficers = useDispatchState((s) => s.setActiveOfficers);

  const getActiveOfficers = React.useCallback(async () => {
    const { json } = await execute("/leo/active-officers", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      setOfficers(json);
      setActiveOfficers(json);
    }
  }, [execute, setActiveOfficers]);

  React.useEffect(() => {
    getActiveOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useListener(SocketEvents.UpdateOfficerStatus, () => {
    getActiveOfficers();
  });

  return (
    <Modal
      title={"Active Officers"}
      isOpen={isOpen(ModalIds.ActiveOfficers)}
      onClose={() => closeModal(ModalIds.ActiveOfficers)}
      className="min-w-[600px]"
    >
      {state === "loading" ? (
        <div className="w-full min-h-[10em] h-full grid place-items-center">
          <Loader className="border-2 w-10 h-10" />
        </div>
      ) : officers.length <= 0 ? (
        <p>{t("noActiveOfficers")}</p>
      ) : (
        <ul className="max-h-[40em] overflow-y-auto space-y-2">
          {officers.map((officer) => (
            <li className="bg-gray-200 p-3 rounded-md" key={officer.id}>
              <p>
                <span className="font-semibold">{t("officer")}: </span> {officer.name}
              </p>
              <p>
                <span className="font-semibold">{t("callsign")}: </span> {officer.callsign}
              </p>
              <p>
                <span className="font-semibold">{t("department")}: </span>
                {officer.department.value}
              </p>
              <p>
                <span className="font-semibold">{t("status")}: </span>
                {officer.status2?.value?.value}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
