import { TOW_SCHEMA } from "@snailycad/schemas";
import { Input, Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { AlertModal } from "components/modal/AlertModal";
import { dataToSlate, Editor } from "components/editor/Editor";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { toastMessage } from "lib/toastMessage";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type {
  PutTowCallsData,
  PutTaxiCallsData,
  PostTaxiCallsData,
  PostTowCallsData,
  DeleteTowCallsData,
  DeleteTaxiCallsData,
} from "@snailycad/types/api";

interface Props {
  call: PutTaxiCallsData | PutTowCallsData | null;
  isTow?: boolean;
  onUpdate?(
    old: PutTaxiCallsData | PutTowCallsData,
    newC: PutTaxiCallsData | PutTowCallsData,
  ): void;
  onDelete?(call: PutTaxiCallsData | PutTowCallsData): void;
  onClose?(): void;
}

export function ManageCallModal({ onDelete, onUpdate, onClose, isTow: tow, call }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { isOpen, closeModal, openModal } = useModal();
  const { state, execute } = useFetch();
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
    const { json } = await execute<DeleteTowCallsData | DeleteTaxiCallsData>({
      path,
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
      const { json } = await execute<PutTowCallsData | PutTaxiCallsData>({
        path,
        method: "PUT",
        data: { ...call, ...values },
      });

      if (json.id) {
        onUpdate?.(call, json);
      }
    } else {
      const { json } = await execute<PostTaxiCallsData | PostTowCallsData>({
        path: isTow ? "/tow" : "/taxi",
        method: "POST",
        data: values,
      });

      if (json.id) {
        toastMessage({
          title: common("success"),
          message: t(isTow ? "towCallCreated" : "taxiCallCreated"),
          icon: "success",
        });
      }
    }

    handleClose();
  }

  function handleClose() {
    closeModal(ModalIds.ManageTowCall);
    onClose?.();
  }

  const INITIAL_VALUES = {
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    creatorId: call?.creatorId ?? "",
    creatorName: call?.creator ? `${call.creator.name} ${call.creator.surname}` : "",
    description: call?.description ?? "",
    descriptionData: dataToSlate(call),
  };

  const validate = handleValidate(TOW_SCHEMA);

  return (
    <Modal
      onClose={handleClose}
      title={title}
      isOpen={isOpen(ModalIds.ManageTowCall)}
      className="w-[700px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, values, isValid, errors }) => (
          <Form>
            <FormField errorMessage={errors.creatorId} label={t("citizen")}>
              <CitizenSuggestionsField
                fromAuthUserOnly
                labelFieldName="creatorName"
                valueFieldName="creatorId"
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
                  onPress={() => openModal(ModalIds.AlertEndTowCall)}
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {t("endCall")}
                </Button>
              ) : null}
              <div className="flex items-center">
                <Button type="reset" onPress={handleClose} variant="cancel">
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
          </Form>
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
