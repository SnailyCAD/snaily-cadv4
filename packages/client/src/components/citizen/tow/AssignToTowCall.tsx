import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import type { TaxiCall, TowCall } from "@snailycad/types";
import { useCitizen } from "context/CitizenContext";
import { useRouter } from "next/router";

interface Props {
  call: TowCall | TaxiCall | null;
  onSuccess: (old: TowCall | TaxiCall, newC: TowCall | TaxiCall) => void;
}

export function AssignToCallModal({ call, onSuccess }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { citizens } = useCitizen();
  const router = useRouter();

  const isTow = router.pathname === "/tow";

  const INITIAL_VALUES = {
    assignedUnitId: call?.assignedUnitId ?? "",
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
    const { json } = await execute(path, {
      method: "PUT",
      data: { ...call, ...values },
    });

    if (json.id) {
      closeModal(ModalIds.AssignToTowCall);
      onSuccess(call, json);
    }
  }

  return (
    <Modal
      title={t("selectUnit")}
      isOpen={isOpen(ModalIds.AssignToTowCall)}
      onClose={() => closeModal(ModalIds.AssignToTowCall)}
      className="w-[500px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ values, errors, isValid, handleChange }) => (
          <Form>
            <FormField errorMessage={errors.assignedUnitId} label={t("selectCitizen")}>
              <Select
                isClearable
                name="assignedUnitId"
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                value={values.assignedUnitId}
                onChange={handleChange}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.AssignToTowCall)}
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
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
