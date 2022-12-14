import { TOW_SCHEMA } from "@snailycad/schemas";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { AlertModal } from "components/modal/AlertModal";
import { dataToSlate, Editor } from "components/editor/editor";
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
import { AddressPostalSelect } from "components/form/select/PostalSelect";

interface Props {
  call: PutTaxiCallsData | PutTowCallsData | null;
  isTow?: boolean;
  onUpdate?(
    old: PutTaxiCallsData | PutTowCallsData,
    newC: PutTaxiCallsData | PutTowCallsData,
  ): void;
  onDelete?(call: PutTaxiCallsData | PutTowCallsData): void;
  onCreate?(call: PostTaxiCallsData | PostTowCallsData): void;
  onClose?(): void;
}

export function ManageCallModal(props: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { isOpen, closeModal, openModal } = useModal();
  const { state, execute } = useFetch();
  const router = useRouter();

  const isTowPath = router.pathname === "/tow";
  const isTow = typeof props.isTow === "undefined" ? isTowPath : props.isTow;
  const title = isTow
    ? props.call
      ? t("editTowCall")
      : t("createTowCall")
    : props.call
    ? t("editTaxiCall")
    : t("createTaxiCall");

  async function handleEndCall() {
    if (!props.call) return;

    const path = isTow ? `/tow/${props.call.id}` : `/taxi/${props.call.id}`;
    const { json } = await execute<DeleteTowCallsData | DeleteTaxiCallsData>({
      path,
      method: "DELETE",
    });

    if (json) {
      props.onDelete?.(props.call);
      closeModal(ModalIds.ManageTowCall);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (props.call) {
      const path = isTow ? `/tow/${props.call.id}` : `/taxi/${props.call.id}`;
      const { json } = await execute<PutTowCallsData | PutTaxiCallsData>({
        path,
        method: "PUT",
        data: { ...props.call, ...values },
      });

      if (json.id) {
        props.onUpdate?.(props.call, json);
      }
    } else {
      const { json } = await execute<PostTaxiCallsData | PostTowCallsData>({
        path: isTow ? "/tow" : "/taxi",
        method: "POST",
        data: values,
      });

      if (json.id) {
        props.onCreate?.(json);
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
    props.onClose?.();
  }

  const INITIAL_VALUES = {
    location: props.call?.location ?? "",
    postal: props.call?.postal ?? "",
    creatorId: props.call?.creatorId ?? "",
    creatorName: props.call?.creator
      ? `${props.call.creator.name} ${props.call.creator.surname}`
      : "",
    description: props.call?.description ?? "",
    descriptionData: dataToSlate(props.call),
  };

  const validate = handleValidate(TOW_SCHEMA);

  return (
    <Modal
      onClose={handleClose}
      title={title}
      isOpen={isOpen(ModalIds.ManageTowCall)}
      className="w-[700px]"
    >
      <Formik
        enableReinitialize
        validate={validate}
        initialValues={INITIAL_VALUES}
        onSubmit={onSubmit}
      >
        {({ setFieldValue, values, isValid, errors }) => (
          <Form>
            <CitizenSuggestionsField
              autoFocus
              allowsCustomValue
              label={t("citizen")}
              fromAuthUserOnly
              labelFieldName="creatorName"
              valueFieldName="creatorId"
            />

            <AddressPostalSelect addressLabel="location" />

            <FormField errorMessage={errors.description} label={common("description")}>
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <footer className={`mt-5 flex ${props.call ? "justify-between" : "justify-end"}`}>
              {props.call ? (
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
                  {props.call ? common("save") : common("create")}
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
