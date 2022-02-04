import { TOW_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/inputs/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { AlertModal } from "components/modal/AlertModal";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "context/ModalContext";
import { Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { ModalIds } from "types/ModalIds";
import type { TaxiCall, TowCall } from "@snailycad/types";
import { useTranslations } from "use-intl";

type CallData = Pick<TowCall, keyof TaxiCall> | TaxiCall;
interface Props {
  call: CallData | null;
  isTow?: boolean;
  onUpdate?: (old: CallData, newC: CallData) => void;
  onDelete?: (call: CallData) => void;
}

export function ManageCallModal({ onDelete, onUpdate, isTow: tow, call }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { isOpen, closeModal, openModal } = useModal();
  const { state, execute } = useFetch();
  const { citizens } = useCitizen();
  const router = useRouter();

  const isTowPath = router.pathname === "/tow";
  const isTow = typeof tow === "undefined" ? isTowPath : tow;
  const title = isTow
    ? call
      ? t("editTowCall")
      : t("createTowCall")
    : call
    ? t("editTaxiCall")
    : t("createTaxiCall");

  async function handleEndCall() {
    if (!call) return;

    const path = isTow ? `/tow/${call.id}` : `/taxi/${call.id}`;
    const { json } = await execute(path, {
      method: "DELETE",
    });

    if (json) {
      onDelete?.(call);
      closeModal(ModalIds.ManageTowCall);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (call) {
      const path = isTow ? `/tow/${call.id}` : `/taxi/${call.id}`;
      const { json } = await execute(path, {
        method: "PUT",
        data: { ...call, ...values },
      });

      if (json.id) {
        onUpdate?.(call, json);
      }
    } else {
      const { json } = await execute(isTow ? "/tow" : "/taxi", {
        method: "POST",
        data: values,
      });

      if (json.id) {
        // todo: add translation
        toast.success("Created.");
      }
    }

    closeModal(ModalIds.ManageTowCall);
  }

  const INITIAL_VALUES = {
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    creatorId: call?.creatorId ?? "",
    description: call?.description ?? "",
    descriptionData: dataToSlate(call),
  };

  const validate = handleValidate(TOW_SCHEMA);

  return (
    <Modal
      onClose={() => closeModal(ModalIds.ManageTowCall)}
      title={title}
      isOpen={isOpen(ModalIds.ManageTowCall)}
      className="w-[700px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleSubmit, handleChange, setFieldValue, values, isValid, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.creatorId} label={t("citizen")}>
              <Select
                disabled={!!call}
                name="creatorId"
                onChange={handleChange}
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                value={values.creatorId}
              />
            </FormField>

            <FormRow>
              <FormField errorMessage={errors.location} label={t("location")}>
                <Input name="location" value={values.location} onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.postal} label={t("postal")}>
                <Input name="postal" value={values.postal} onChange={handleChange} />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.description} label={common("description")}>
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <footer className={`mt-5 flex ${call ? "justify-between" : "justify-end"}`}>
              {call ? (
                <Button
                  variant="danger"
                  className="flex items-center mr-2"
                  disabled={state === "loading"}
                  type="button"
                  onClick={() => openModal(ModalIds.AlertEndTowCall)}
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {t("endCall")}
                </Button>
              ) : null}
              <div className="flex items-center">
                <Button
                  type="reset"
                  onClick={() => closeModal(ModalIds.ManageTowCall)}
                  variant="cancel"
                >
                  {common("cancel")}
                </Button>
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {call ? common("save") : common("create")}
                </Button>
              </div>
            </footer>
          </form>
        )}
      </Formik>

      <AlertModal
        title={t("endCall")}
        description={t("alert_endTowCall")}
        id={ModalIds.AlertEndTowCall}
        onDeleteClick={handleEndCall}
        deleteText={t("endCall")}
        state={state}
      />
    </Modal>
  );
}
