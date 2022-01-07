import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "context/ModalContext";
import { useImageUrl } from "hooks/useImageUrl";

export function CitizenImageModal() {
  const { citizen } = useCitizen(false);
  const { isOpen, closeModal } = useModal();
  const { makeImageUrl } = useImageUrl();

  return (
    <Modal
      title={`${citizen.name} ${citizen.surname}`}
      onClose={() => closeModal("citizenImage")}
      isOpen={isOpen("citizenImage")}
    >
      <div className="flex items-center justify-center mt-10">
        <img
          draggable={false}
          className="rounded-md w-[40em] h-[40em] object-cover"
          src={makeImageUrl("citizens", citizen.imageId!)}
        />
      </div>
    </Modal>
  );
}
