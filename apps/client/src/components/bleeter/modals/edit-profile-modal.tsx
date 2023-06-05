import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { NewBleeterExperienceForm } from "../new-bleeter-experience";
import { BleeterProfile } from "@snailycad/types";

interface EditBleeterProfileModalProps {
  profile: BleeterProfile;
}

export function EditBleeterProfileModal(props: EditBleeterProfileModalProps) {
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Bleeter");

  return (
    <Modal
      className="w-[600px]"
      onClose={() => closeModal(ModalIds.ManageBleeterProfile)}
      title={t("editProfile")}
      isOpen={isOpen(ModalIds.ManageBleeterProfile)}
    >
      <NewBleeterExperienceForm {...props} showFormOnly />
    </Modal>
  );
}
