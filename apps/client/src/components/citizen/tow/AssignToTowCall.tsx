import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";
import { Loader, Button } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useRouter } from "next/router";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { PutTaxiCallsData, PutTowCallsData } from "@snailycad/types/api";

interface Props {
  call: PutTaxiCallsData | PutTowCallsData | null;
  onSuccess(
    old: PutTaxiCallsData | PutTowCallsData,
    newC: PutTaxiCallsData | PutTowCallsData,
  ): void;
  onClose?(): void;
}

export function AssignToCallModal({ call, onClose, onSuccess }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const router = useRouter();
  const isTow = router.pathname === "/tow";

  const INITIAL_VALUES = {
    assignedUnitId: call?.assignedUnitId ?? "",
    assignedUnitName: call?.assignedUnit
      ? `${call.assignedUnit.name} ${call.assignedUnit.surname}`
      : "",
  };

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!call) return;

    if (!call.assignedUnitId && !values.assignedUnitId) {
      helpers.setFieldError("assignedUnitId", "This field is required.");
      return;
    }

    const path = isTow ? `/tow/${call.id}` : `/taxi/${call.id}`;
    const { json } = await execute<PutTaxiCallsData | PutTowCallsData>({
      path,
      method: "PUT",
      data: { ...call, ...values },
    });

    if (json.id) {
      closeModal(ModalIds.AssignToTowCall);
      onSuccess(call, json);
    }
  }

  function handleClose() {
    closeModal(ModalIds.AssignToTowCall);
    onClose?.();
  }

  return (
    <Modal
      title={t("selectUnit")}
      isOpen={isOpen(ModalIds.AssignToTowCall)}
      onClose={handleClose}
      className="w-[500px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ isValid }) => (
          <Form>
            <CitizenSuggestionsField
              autoFocus
              allowsCustomValue
              label={t("selectCitizen")}
              fromAuthUserOnly
              labelFieldName="assignedUnitName"
              valueFieldName="assignedUnitId"
            />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
