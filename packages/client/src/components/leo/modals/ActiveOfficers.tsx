import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Loader } from "components/Loader";
import { useTranslations } from "use-intl";
import { useActiveOfficers } from "hooks/useActiveOfficers";

export const ActiveOfficersModal = () => {
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Leo");
  const { activeOfficers, state } = useActiveOfficers();

  return (
    <Modal
      title={t("activeOfficers")}
      isOpen={isOpen(ModalIds.ActiveOfficers)}
      onClose={() => closeModal(ModalIds.ActiveOfficers)}
      className="min-w-[600px]"
    >
      {state === "loading" ? (
        <div className="w-full min-h-[10em] h-full grid place-items-center">
          <Loader className="border-2 w-10 h-10" />
        </div>
      ) : activeOfficers.length <= 0 ? (
        <p>{t("noActiveOfficers")}</p>
      ) : (
        <ul className="max-h-[40em] overflow-y-auto space-y-2">
          {activeOfficers.map((officer) => (
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
                {officer.status?.value?.value}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
