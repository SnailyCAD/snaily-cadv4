import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { Pencil } from "react-bootstrap-icons";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const ManageAOPModal = dynamic(
  async () => (await import("./modals/manage-area-of-play-modal")).ManageAreaOfPlayModal,
  { ssr: false },
);

export function DispatchAreaOfPlay() {
  const { areaOfPlay } = useAreaOfPlay();
  const modalState = useModal();
  const t = useTranslations("Leo");

  return (
    <>
      <span>
        {" "}
        - AOP: {areaOfPlay}
        <Button
          onPress={() => modalState.openModal(ModalIds.ManageAOP)}
          variant={null}
          className="px-1.5 p-1 ml-2 bg-gray-500 hover:bg-gray-600 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 text-white"
          aria-label={t("updateAOP")}
          title={t("updateAOP")}
        >
          <Pencil width={15} height={15} />
        </Button>
      </span>

      <ManageAOPModal />
    </>
  );
}
