import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { AlertModal } from "components/modal/AlertModal";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import * as React from "react";
import { FullBolo, useDispatchState } from "state/dispatchState";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { Bolo, BoloType, ShouldDoType } from "types/prisma";
import { useTranslations } from "use-intl";
import { ManageBoloModal } from "./ManageBoloModal";

const BOLO_TYPES = Object.values(BoloType);

export const ActiveBolos = () => {
  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const { bolos, setBolos } = useDispatchState();
  const [tempBolo, setTempBolo] = React.useState<FullBolo | null>(null);

  useListener(
    SocketEvents.CreateBolo,
    (data) => {
      setBolos([...[...bolos], data]);
    },
    [setBolos, bolos],
  );

  useListener(
    SocketEvents.DeleteBolo,
    (bolo: Pick<Bolo, "id">) => {
      setBolos(bolos.filter((v) => v.id !== bolo.id));
    },
    [setBolos, bolos],
  );

  useListener(
    SocketEvents.UpdateBolo,
    (bolo: FullBolo) => {
      setBolos(
        bolos.map((v) => {
          if (v.id === bolo.id) {
            return bolo;
          }

          return v;
        }),
      );
    },
    [setBolos, bolos],
  );

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
    <div className="mt-3 bg-gray-200/80 overflow-hidden rounded-md">
      <header className="bg-gray-300/50 px-4 p-2">
        <h3 className="text-xl font-semibold">{"Active Bolos"}</h3>
      </header>

      <div className="px-4">
        {bolos.length <= 0 ? (
          <p className="py-2">{"There are no active bolos."}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BOLO_TYPES.map((boloType) => {
              const items = bolos.filter((v) => v.type === boloType);

              return (
                <div key={boloType}>
                  <h1 className="font-semibold text-xl my-2 capitalize">
                    {boloType.toLowerCase()} bolos
                  </h1>

                  <ul className="py-2 space-y-2 overflow-auto max-h-[30em]">
                    {items.length <= 0 ? (
                      <p>{`No active bolos for type: ${boloType.toLowerCase()}`}</p>
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
        <ManageBoloModal onClose={() => setTimeout(() => setTempBolo(null), 100)} bolo={tempBolo} />

        <AlertModal
          title={"Delete Bolo"}
          onDeleteClick={handleDeleteBolo}
          description={"Are you sure you want to delete this bolo? This action cannot be undone"}
          id={ModalIds.AlertDeleteBolo}
          onClose={() => setTempBolo(null)}
          state={state}
        />
      </>
    </div>
  );
};

interface BoloItemProps {
  idx: number;
  bolo: FullBolo;
  handleEdit: (bolo: FullBolo) => void;
  handleDelete: (bolo: FullBolo) => void;
}

const BoloItem = ({ idx, bolo, handleDelete, handleEdit }: BoloItemProps) => {
  const t = useTranslations("Leo");
  const { activeOfficer } = useLeoState();
  const { pathname } = useRouter();
  const isDispatchRoute = pathname === "/dispatch";
  const isDisabled = isDispatchRoute
    ? false
    : !activeOfficer || activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY;

  return (
    <li key={bolo.id} className="flex justify-between">
      <div className="flex">
        <span className="select-none text-gray-500 mr-2">{idx + 1}. </span>

        <div>
          {bolo.type === BoloType.PERSON ? (
            <p id="description">
              {bolo.description} <br />
              <span className="font-semibold">{"Name"}: </span>
              {bolo.name}
            </p>
          ) : bolo.type === BoloType.VEHICLE ? (
            <p>
              {bolo.description} <br />
              <span className="font-semibold">{"Plate"}: </span>
              {bolo.plate?.toUpperCase()}
              <br />
              <span className="font-semibold">{"Color"}: </span>
              {bolo.color}
              <br />
              <span className="font-semibold">{"Model"}: </span>
              {bolo.model}
            </p>
          ) : (
            <p>{bolo.description}</p>
          )}

          <p>
            <span className="font-semibold">{"Officer"}: </span>
            {bolo?.officer?.name ?? t("dispatch")}
          </p>
        </div>
      </div>

      <div>
        <Button small disabled={isDisabled} onClick={() => handleEdit(bolo)} variant="success">
          Edit
        </Button>
        <Button
          small
          className="ml-2"
          disabled={isDisabled}
          onClick={() => handleDelete(bolo)}
          variant="danger"
        >
          Delete
        </Button>
      </div>
    </li>
  );
};
