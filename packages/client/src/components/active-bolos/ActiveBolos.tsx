import { AlertModal } from "components/modal/AlertModal";
import { useModal } from "state/modalState";
import { useBolos } from "hooks/realtime/useBolos";
import useFetch from "lib/useFetch";
import * as React from "react";
import { ModalIds } from "types/ModalIds";
import { Bolo, BoloType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { ManageBoloModal } from "./ManageBoloModal";
import { BoloItem } from "./BoloItem";

const BOLO_TYPES = Object.values(BoloType);

export function ActiveBolos() {
  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const { bolos, setBolos } = useBolos();
  const [tempBolo, setTempBolo] = React.useState<Bolo | null>(null);
  const t = useTranslations("Bolos");

  async function handleDeleteBolo() {
    if (!tempBolo) return;

    const { json } = await execute(`/bolos/${tempBolo.id}`, {
      method: "DELETE",
    });

    if (json) {
      setBolos(bolos.filter((v) => v.id !== tempBolo.id));
      setTempBolo(null);
      closeModal(ModalIds.AlertDeleteBolo);
    }
  }

  function handleEditClick(bolo: Bolo) {
    setTempBolo(bolo);
    openModal(ModalIds.ManageBolo);
  }

  function handleDeleteClick(bolo: Bolo) {
    setTempBolo(bolo);
    openModal(ModalIds.AlertDeleteBolo);
  }

  return (
    <div className="mt-3 overflow-hidden card">
      <header className="p-2 px-4 bg-gray-300/50 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("activeBolos")}</h3>
      </header>

      <div className="px-4">
        {bolos.length <= 0 ? (
          <p className="py-2">{t("noActiveBolos")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BOLO_TYPES.map((boloType) => {
              const items = bolos.filter((v) => v.type === boloType);

              return (
                <div key={boloType}>
                  <h1 className="my-2 text-xl font-semibold capitalize">
                    {t.rich("typeBolos", { type: boloType.toLowerCase() })}
                  </h1>

                  <ul className="py-2 space-y-2 overflow-auto max-h-[30em]">
                    {items.length <= 0 ? (
                      <p>
                        {t.rich("noActiveBolosForType", {
                          type: t(boloType.toLowerCase()),
                        })}
                      </p>
                    ) : (
                      items.map((bolo, idx) => (
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
            })}
          </div>
        )}
      </div>

      {/* timeout: wait for modal to close */}
      <ManageBoloModal onClose={() => setTimeout(() => setTempBolo(null), 80)} bolo={tempBolo} />

      <AlertModal
        title={t("deleteBolo")}
        onDeleteClick={handleDeleteBolo}
        description={t("alert_deleteBolo")}
        id={ModalIds.AlertDeleteBolo}
        onClose={() => setTempBolo(null)}
        state={state}
      />
    </div>
  );
}
