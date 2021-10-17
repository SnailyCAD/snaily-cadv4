import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { AlertModal } from "components/modal/AlertModal";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import * as React from "react";
import { FullBolo, useDispatchState } from "state/dispatchState";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { Bolo, BoloType, StatusEnum } from "types/prisma";
import { ManageBoloModal } from "./ManageBoloModal";

export const ActiveBolos = () => {
  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const { bolos, setBolos } = useDispatchState();
  const [tempBolo, setTempBolo] = React.useState<FullBolo | null>(null);
  const { activeOfficer } = useLeoState();

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
    <div className="mt-3 bg-gray-200/80 rounded-md overflow-hidden">
      <header className="bg-gray-300/50 px-4 p-2">
        <h3 className="text-xl font-semibold">{"Active Bolos"}</h3>
      </header>

      <div className="px-4">
        {bolos.length <= 0 ? (
          <p className="py-2">{"There are no active bolos."}</p>
        ) : (
          <ul className="py-2 space-y-2">
            {bolos.map((bolo, idx) => (
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
                      </p>
                    ) : (
                      <p>{bolo.description}</p>
                    )}
                    {"officer" in bolo ? (
                      <p>
                        <span className="font-semibold">{"Officer"}: </span>
                        {bolo.officer.name}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <Button
                    disabled={!activeOfficer || activeOfficer.status === StatusEnum.OFF_DUTY}
                    onClick={() => handleEditClick(bolo)}
                    variant="success"
                  >
                    Edit
                  </Button>
                  <Button
                    className="ml-2"
                    disabled={!activeOfficer || activeOfficer.status === StatusEnum.OFF_DUTY}
                    onClick={() => handleDeleteClick(bolo)}
                    variant="danger"
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* timeout: wait for modal to close */}
      {activeOfficer ? (
        <>
          <ManageBoloModal
            onClose={() => setTimeout(() => setTempBolo(null), 100)}
            bolo={tempBolo}
          />

          <AlertModal
            title={"Delete Bolo"}
            onDeleteClick={handleDeleteBolo}
            description={"Are you sure you want to delete this bolo? This action cannot be undone"}
            id={ModalIds.AlertDeleteBolo}
            onClose={() => setTempBolo(null)}
            state={state}
          />
        </>
      ) : null}
    </div>
  );
};
