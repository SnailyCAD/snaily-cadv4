import type { Citizen } from "@snailycad/types";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useImageUrl } from "hooks/useImageUrl";
import { ModalIds } from "types/ModalIds";
import { ImageWrapper } from "components/shared/image-wrapper";

interface Props {
  citizen: Citizen;
}

export function CitizenImageModal({ citizen }: Props) {
  const { isOpen, closeModal } = useModal();
  const { makeImageUrl } = useImageUrl();

  return (
    <Modal
      title={`${citizen.name} ${citizen.surname}`}
      onClose={() => closeModal(ModalIds.CitizenImage)}
      isOpen={isOpen(ModalIds.CitizenImage)}
    >
      <div className="flex items-center justify-center mt-10">
        <ImageWrapper
          quality={100}
          placeholder={citizen.imageBlurData ? "blur" : "empty"}
          blurDataURL={citizen.imageBlurData ?? undefined}
          draggable={false}
          className="rounded-md w-[40em] h-[40em] object-cover"
          src={makeImageUrl("citizens", citizen.imageId!)!}
          width={640}
          height={640}
          alt={`${citizen.name} ${citizen.surname}`}
          fallback={<p>Failed to load image.</p>}
        />
      </div>
    </Modal>
  );
}
