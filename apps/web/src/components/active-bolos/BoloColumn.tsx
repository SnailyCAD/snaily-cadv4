import * as React from "react";
import { Bolo, BoloType } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { BoloItem } from "./BoloItem";

interface Props {
  boloType: BoloType;
  bolos: Bolo[];
  setTempBolo: React.Dispatch<React.SetStateAction<Bolo["id"] | null>>;
}

const ESTIMATED_SIZES = {
  [BoloType.PERSON]: 100,
  [BoloType.VEHICLE]: 170,
  [BoloType.OTHER]: 125,
};

export function BoloColumn({ bolos, boloType, setTempBolo }: Props) {
  const { openModal } = useModal();
  const t = useTranslations("Bolos");

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: bolos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_SIZES[boloType],
    enableSmoothScroll: true,
  });

  function handleEditClick(bolo: Bolo) {
    setTempBolo(bolo.id);
    openModal(ModalIds.ManageBolo);
  }

  function handleDeleteClick(bolo: Bolo) {
    setTempBolo(bolo.id);
    openModal(ModalIds.AlertDeleteBolo);
  }

  return (
    <div key={boloType}>
      <h1 className="my-2 text-xl font-semibold capitalize">
        {t.rich("typeBolos", { type: boloType.toLowerCase() })}
      </h1>

      {bolos.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-300">
          {t.rich("noActiveBolosForType", {
            type: t(boloType.toLowerCase()),
          })}
        </p>
      ) : (
        <div ref={parentRef} className="h-[25em] w-full overflow-auto">
          <ul style={{ height: rowVirtualizer.getTotalSize() }} className="py-2 space-y-2 relative">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const bolo = bolos[virtualRow.index];
              if (!bolo) return null;

              return (
                <li
                  key={virtualRow.index}
                  ref={virtualRow.measureElement}
                  className="absolute top-0 left-0 w-full flex justify-between"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <BoloItem
                    key={bolo.id}
                    bolo={bolo}
                    idx={virtualRow.index}
                    handleEdit={handleEditClick}
                    handleDelete={handleDeleteClick}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
