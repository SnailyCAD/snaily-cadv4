import * as React from "react";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { useImageUrl } from "hooks/useImageUrl";

export function CitizenImageModal() {
  const { execute } = useFetch();
  const { citizen, setCurrentCitizen } = useCitizen(false);
  const { isOpen, closeModal } = useModal();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { makeImageUrl } = useImageUrl();

  function handleEditImageClick() {
    if (fileRef.current) {
      fileRef.current.click();
    }
  }

  async function onImageSelectClick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0) ?? null;
    const fd = new FormData();

    if (!file) return;
    if (!citizen) return;

    fd.append("image", file, file.name);

    const { json } = await execute(`/citizen/${citizen.id}`, {
      method: "POST",
      data: fd,
    });

    if (json.imageId) {
      // `v` is to update the state. imageId will 80% be the same
      const v = Math.floor(Math.random() * 100);
      setCurrentCitizen({ ...citizen, imageId: `${json.imageId}?v=${v}` });
    }
  }

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

      <div className="flex justify-center w-full mt-5">
        <input onChange={onImageSelectClick} className="hidden" type="file" ref={fileRef} />
        <Button onClick={handleEditImageClick}>Edit Image</Button>
      </div>
    </Modal>
  );
}
