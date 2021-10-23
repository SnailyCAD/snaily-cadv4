import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Loader } from "components/Loader";
import { useTranslations } from "use-intl";
import { useActiveDeputies } from "hooks/useActiveDeputies";

export const ActiveDeputiesModal = () => {
  const { isOpen, closeModal } = useModal();
  const t = useTranslations();
  const { activeDeputies, state } = useActiveDeputies();

  return (
    <Modal
      title={t("Ems.activeDeputies")}
      isOpen={isOpen(ModalIds.ActiveDeputies)}
      onClose={() => closeModal(ModalIds.ActiveDeputies)}
      className="min-w-[600px]"
    >
      {state === "loading" ? (
        <div className="w-full min-h-[10em] h-full grid place-items-center">
          <Loader className="border-2 w-10 h-10" />
        </div>
      ) : activeDeputies.length <= 0 ? (
        <p>{t("Ems.noActiveDeputies")}</p>
      ) : (
        <ul className="max-h-[40em] overflow-y-auto space-y-2">
          {activeDeputies.map((officer) => (
            <li className="bg-gray-200 p-3 rounded-md" key={officer.id}>
              <p>
                <span className="font-semibold">{t("Leo.officer")}: </span> {officer.name}
              </p>
              <p>
                <span className="font-semibold">{t("Leo.callsign")}: </span> {officer.callsign}
              </p>
              <p>
                <span className="font-semibold">{t("Leo.department")}: </span>
                {officer.department.value}
              </p>
              <p>
                <span className="font-semibold">{t("Leo.status")}: </span>
                {officer.status2?.value?.value}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
