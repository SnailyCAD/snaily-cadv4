import { SELECT_DEPUTY_SCHEMA } from "@snailycad/schemas";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { useEmsFdState } from "state/emsFdState";
import { useValues } from "context/ValuesContext";
import { EmsFdDeputy, ShouldDoType } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { isUnitDisabled, makeUnitName } from "lib/utils";
import type { PutDispatchStatusByUnitId } from "@snailycad/types/api";

export function SelectDeputyModal() {
  const { deputies, setActiveDeputy } = useEmsFdState();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Ems");
  const { generateCallsign } = useGenerateCallsign();

  const { state, execute } = useFetch();

  const { codes10 } = useValues();
  const onDutyCode = codes10.values.find((v) => v.shouldDo === ShouldDoType.SET_ON_DUTY);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!onDutyCode) return;

    const { json } = await execute<PutDispatchStatusByUnitId>({
      path: `/dispatch/status/${values.deputy}`,
      method: "PUT",
      data: {
        ...values,
        status: onDutyCode.id,
      },
    });

    if (json.id) {
      closeModal(ModalIds.SelectDeputy);
      setActiveDeputy(json as EmsFdDeputy);
    }
  }

  const validate = handleValidate(SELECT_DEPUTY_SCHEMA);
  const INITIAL_VALUES = {
    deputy: "",
  };

  return (
    <Modal
      title={t("selectDeputy")}
      onClose={() => closeModal(ModalIds.SelectDeputy)}
      isOpen={isOpen(ModalIds.SelectDeputy)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.deputy} label={t("deputy")}>
              <Select
                value={values.deputy}
                name="deputy"
                onChange={handleChange}
                isClearable
                values={deputies.map((deputy) => ({
                  label: `${generateCallsign(deputy)} ${makeUnitName(deputy)}`,
                  value: deputy.id,
                  isDisabled: isUnitDisabled(deputy),
                }))}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.SelectDeputy)}
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
