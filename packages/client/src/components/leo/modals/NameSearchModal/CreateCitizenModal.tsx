import * as React from "react";
import type { Citizen } from "@snailycad/types";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import { useValues } from "context/ValuesContext";
import { Loader } from "components/Loader";

interface Props {
  onCreate?(citizen: Citizen): void;
}

function useLoadValues() {
  const { setValues } = useValues();

  const { state, execute } = useFetch({ overwriteState: "loading" });

  const handleFetch = React.useCallback(async () => {
    const { json } = await execute("/admin/values/gender?paths=ethnicity", { method: "GET" });

    if (json && Array.isArray(json)) {
      setValues(json);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  return { isLoading: state === "loading" };
}

export function CreateCitizenModal({ onCreate }: Props) {
  const { isLoading } = useLoadValues();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();

  function handleClose() {
    closeModal(ModalIds.CreateCitizen);
  }

  async function onSubmit() {
    const { json } = await execute("/notes", {
      method: "POST",
      data: {},
    });

    if (json.id) {
      onCreate?.(json);
      handleClose();
    }
  }

  return (
    <Modal
      title={t("createCitizen")}
      isOpen={isOpen(ModalIds.CreateCitizen)}
      onClose={handleClose}
      className="w-[1000px]"
    >
      {isLoading ? (
        <div className="w-full grid place-items-center h-52">
          <Loader className="w-14 h-14 border-[3px]" />
        </div>
      ) : (
        <ManageCitizenForm onSubmit={onSubmit} citizen={null} state={state} />
      )}
    </Modal>
  );
}
