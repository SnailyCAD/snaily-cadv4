import type { Value } from "@snailycad/types";
import { Button, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/modal-ids";
import type { PutSearchActionsCitizenFlagsData } from "@snailycad/types/api";

export function ManageCitizenFlagsModal() {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const veh = useTranslations("Vehicles");
  const { currentResult, setCurrentResult } = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));
  const { citizenFlag } = useValues();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsCitizenFlagsData>({
      path: `/search/actions/citizen-flags/${currentResult.id}`,
      method: "PUT",
      data: { flags: values.flags.map((v) => v) },
    });

    if (json.flags) {
      setCurrentResult({ ...currentResult, ...json });
      modalState.closeModal(ModalIds.ManageCitizenFlags);
    }
  }

  function makeValueOption(v: Value) {
    return { label: v.value, value: v.id };
  }

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  const INITIAL_VALUES = {
    flags: currentResult.flags?.map((v) => v.id) ?? [],
  };

  return (
    <Modal
      title={t("manageCitizenFlags")}
      isOpen={modalState.isOpen(ModalIds.ManageCitizenFlags)}
      onClose={() => modalState.closeModal(ModalIds.ManageCitizenFlags)}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors, isValid }) => (
          <Form autoComplete="off">
            <SelectField
              errorMessage={errors.flags as string}
              label={veh("flags")}
              selectionMode="multiple"
              options={citizenFlag.values.map(makeValueOption)}
              selectedKeys={values.flags}
              onSelectionChange={(keys) => setFieldValue("flags", keys)}
            />

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.ManageCitizenFlags)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={!isValid} type="submit">
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
