import { AlertModal } from "components/modal/AlertModal";
import { useModal } from "state/modalState";
import { useBolos } from "hooks/realtime/useBolos";
import useFetch from "lib/useFetch";
import * as React from "react";
import { ModalIds } from "types/ModalIds";
import { Bolo, BoloType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { ManageBoloModal } from "./ManageBoloModal";
import { BoloColumn } from "./BoloColumn";

const BOLO_TYPES = Object.values(BoloType);

export function ActiveBolos() {
  const { state, execute } = useFetch();
  const { closeModal } = useModal();
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

  return (
    <div className="mt-3 overflow-hidden card">
      <header className="p-2 px-4 bg-gray-200 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("activeBolos")}</h3>
      </header>

      <div className="px-4">
        {bolos.length <= 0 ? (
          <p className="py-2 text-neutral-700 dark:text-gray-300">{t("noActiveBolos")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BOLO_TYPES.map((boloType) => {
              const bolosForType = bolos.filter((v) => v.type === boloType);
              return (
                <BoloColumn
                  boloType={boloType}
                  setTempBolo={setTempBolo}
                  key={boloType}
                  bolos={bolosForType}
                />
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
