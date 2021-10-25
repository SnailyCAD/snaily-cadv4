import { SELECT_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { useLeoState } from "state/leoState";
import { useValues } from "context/ValuesContext";
import { ShouldDoType } from "types/prisma";

export const SelectOfficerModal = () => {
  const { officers, setActiveOfficer } = useLeoState();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  const { codes10 } = useValues();
  const onDutyCode = codes10.values.find((v) => v.shouldDo === ShouldDoType.SET_ON_DUTY);
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!onDutyCode) return;

    const { json } = await execute(`/leo/${values.officer}/status`, {
      method: "PUT",
      data: {
        ...values,
        status: onDutyCode.id,
      },
    });

    if (json.id) {
      closeModal(ModalIds.SelectOfficer);
      setActiveOfficer(json);
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
      className="min-w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("officer")}>
              <Select
                value={values.officer}
                hasError={!!errors.officer}
                name="officer"
                onChange={handleChange}
                isClearable
                values={officers.map((officer) => ({
                  // @ts-expect-error ignore, will fix later
                  label: `${officer.callsign} ${officer.name} (${officer.department?.value})`,
                  value: officer.id,
                }))}
              />
              <Error>{errors.officer}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
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
};
