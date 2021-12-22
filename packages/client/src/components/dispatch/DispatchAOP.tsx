import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { useAreaOfPlay } from "hooks/useAreaOfPlay";
import { Pencil } from "react-bootstrap-icons";
import { ModalIds } from "types/ModalIds";
import { ManageAOPModal } from "./modals/ManageAOPModal";

export function DispatchAOP() {
  const { areaOfPlay } = useAreaOfPlay();
  const { openModal } = useModal();

  return (
    <>
      <span>
        {" "}
        - AOP: {areaOfPlay}
        <Button
          onClick={() => openModal(ModalIds.ManageAOP)}
          className="px-1.5 p-1 ml-2 dark:hover:bg-gray-2"
          variant="transparent"
          aria-label="Update Area of play"
          title="Update Area of play"
        >
          <Pencil width={15} height={15} />
        </Button>
      </span>

      <ManageAOPModal />
    </>
  );
}
