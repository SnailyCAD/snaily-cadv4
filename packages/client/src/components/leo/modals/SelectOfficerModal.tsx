import { SELECT_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { useLeoState } from "state/leoState";
import { useValues } from "context/ValuesContext";
import { Officer, ShouldDoType } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { isUnitDisabled, makeUnitName } from "lib/utils";
import type { PutDispatchStatusByUnitId } from "@snailycad/types/api";

export function SelectOfficerModal() {
  const { userOfficers, setActiveOfficer } = useLeoState();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  const { codes10 } = useValues();
  const onDutyCode = codes10.values.find((v) => v.shouldDo === ShouldDoType.SET_ON_DUTY);
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!onDutyCode) return;

    const { json } = await execute<PutDispatchStatusByUnitId>({
      path: `/dispatch/status/${values.officer}`,
      method: "PUT",
      data: {
        status: onDutyCode.id,
      },
    });

    if (json.id) {
      closeModal(ModalIds.SelectOfficer);
      setActiveOfficer(json as Officer);
    }
  }

  const validate = handleValidate(SELECT_OFFICER_SCHEMA);
  const INITIAL_VALUES = {
    officer: "",
  };

  return (
    <Modal
      title={t("selectOfficer")}
      onClose={() => closeModal(ModalIds.SelectOfficer)}
      isOpen={isOpen(ModalIds.SelectOfficer)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.officer} label={t("officer")}>
              <Select
                value={values.officer}
                name="officer"
                onChange={handleChange}
                isClearable
                values={userOfficers.map((officer) => ({
                  label: `${generateCallsign(officer)} ${makeUnitName(officer)}`,
                  value: officer.id,
                  isDisabled: isUnitDisabled(officer),
                }))}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.SelectOfficer)}
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
