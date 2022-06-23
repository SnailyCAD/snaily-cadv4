import type { Bolo, BoloType } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { BoloItem } from "./BoloItem";

interface Props {
  boloType: BoloType;
  bolos: Bolo[];
  setTempBolo: React.Dispatch<React.SetStateAction<Bolo | null>>;
}

export function BoloColumn({ bolos, boloType, setTempBolo }: Props) {
  const { openModal } = useModal();
  const t = useTranslations("Bolos");

  function handleEditClick(bolo: Bolo) {
    setTempBolo(bolo);
    openModal(ModalIds.ManageBolo);
  }

  function handleDeleteClick(bolo: Bolo) {
    setTempBolo(bolo);
    openModal(ModalIds.AlertDeleteBolo);
  }

  return (
    <div key={boloType}>
      <h1 className="my-2 text-xl font-semibold capitalize">
        {t.rich("typeBolos", { type: boloType.toLowerCase() })}
      </h1>

      <ul className="py-2 space-y-2 overflow-auto max-h-[30em]">
        {bolos.length <= 0 ? (
          <p className="text-neutral-700 dark:text-gray-300">
            {t.rich("noActiveBolosForType", {
              type: t(boloType.toLowerCase()),
            })}
          </p>
        ) : (
          bolos.map((bolo, idx) => (
            <BoloItem
              key={bolo.id}
              bolo={bolo}
              idx={idx}
              handleEdit={handleEditClick}
              handleDelete={handleDeleteClick}
            />
          ))
        )}
      </ul>
    </div>
  );
}
