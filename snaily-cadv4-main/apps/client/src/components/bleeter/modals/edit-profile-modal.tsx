import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { NewBleeterExperienceForm } from "../new-bleeter-experience";
import type { BleeterProfile } from "@snailycad/types";

interface EditBleeterProfileModalProps {
  profile: BleeterProfile;
}

export function EditBleeterProfileModal(props: EditBleeterProfileModalProps) {
  const modalState = useModal();
  const t = useTranslations("Bleeter");

  return (
    <Modal
      className="w-[600px]"
      onClose={() => modalState.closeModal(ModalIds.ManageBleeterProfile)}
      title={t("editProfile")}
      isOpen={modalState.isOpen(ModalIds.ManageBleeterProfile)}
    >
      <NewBleeterExperienceForm {...props} showFormOnly />
    </Modal>
  );
}
