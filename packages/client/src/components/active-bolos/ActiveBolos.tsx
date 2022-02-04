import { Button } from "components/Button";
import { AlertModal } from "components/modal/AlertModal";
import { useModal } from "context/ModalContext";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { useBolos } from "hooks/realtime/useBolos";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { makeUnitName } from "lib/utils";
import { useRouter } from "next/router";
import * as React from "react";
import type { FullBolo } from "state/dispatchState";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { BoloType, ShouldDoType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { ManageBoloModal } from "./ManageBoloModal";

const BOLO_TYPES = Object.values(BoloType);

export function ActiveBolos() {
  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const { bolos, setBolos } = useBolos();
  const [tempBolo, setTempBolo] = React.useState<FullBolo | null>(null);
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

  function handleEditClick(bolo: FullBolo) {
    setTempBolo(bolo);
    openModal(ModalIds.ManageBolo);
  }

  function handleDeleteClick(bolo: FullBolo) {
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
                          type: boloType.toLowerCase(),
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
      <>
        <ManageBoloModal onClose={() => setTimeout(() => setTempBolo(null), 80)} bolo={tempBolo} />

        <AlertModal
          title={t("deleteBolo")}
          onDeleteClick={handleDeleteBolo}
          description={t("alert_deleteBolo")}
          id={ModalIds.AlertDeleteBolo}
          onClose={() => setTempBolo(null)}
          state={state}
        />
      </>
    </div>
  );
}

interface BoloItemProps {
  idx: number;
  bolo: FullBolo;
  handleEdit: (bolo: FullBolo) => void;
  handleDelete: (bolo: FullBolo) => void;
}

function BoloItem({ idx, bolo, handleDelete, handleEdit }: BoloItemProps) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { activeOfficer } = useLeoState();
  const { pathname } = useRouter();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const isDispatchRoute = pathname === "/dispatch";
  const isDisabled = isDispatchRoute
    ? !hasActiveDispatchers
    : !activeOfficer || activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY;

  const generateCallsign = useGenerateCallsign();

  return (
    <li key={bolo.id} className="flex justify-between">
      <div className="flex">
        <span className="mr-2 text-gray-500 select-none">{idx + 1}.</span>

        <div>
          {bolo.type === BoloType.PERSON ? (
            <div id="description">
              <p className="mb-1">{bolo.description}</p>
              <span className="font-semibold">{common("name")}: </span>
              {bolo.name}
            </div>
          ) : bolo.type === BoloType.VEHICLE ? (
            <div>
              <p className="mb-1">{bolo.description}</p>
              <span className="font-semibold">{t("plate")}: </span>
              {bolo.plate?.toUpperCase() || common("none")}
              <br />
              <span className="font-semibold">{t("color")}: </span>
              {bolo.color || common("none")}
              <br />
              <span className="font-semibold">{t("model")}: </span>
              {bolo.model || common("none")}
            </div>
          ) : (
            <p className="text-justify">{bolo.description}</p>
          )}

          <p>
            <span className="font-semibold">{t("officer")}: </span>
            {bolo.officer
              ? `${generateCallsign(bolo.officer)} ${makeUnitName(bolo.officer)}`
              : t("dispatch")}
          </p>
        </div>
      </div>

      <div className="ml-2 min-w-fit">
        <Button small disabled={isDisabled} onClick={() => handleEdit(bolo)} variant="success">
          {common("edit")}
        </Button>
        <Button
          small
          className="ml-2"
          disabled={isDisabled}
          onClick={() => handleDelete(bolo)}
          variant="danger"
        >
          {common("delete")}
        </Button>
      </div>
    </li>
  );
}
