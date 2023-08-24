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
import type { PutSearchActionsCitizenAddressFlagsData } from "@snailycad/types/api";

export function ManageCitizenAddressFlagsModal() {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const cT = useTranslations("Citizen");
  const { currentResult, setCurrentResult } = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));
  const { addressFlag } = useValues();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsCitizenAddressFlagsData>({
      path: `/search/actions/citizen-address-flags/${currentResult.id}`,
      method: "PUT",
      data: { addressFlags: values.addressFlags.map((v) => v) },
    });

    if (json.addressFlags) {
      setCurrentResult({ ...currentResult, ...json });
      modalState.closeModal(ModalIds.ManageAddressFlags);
    }
  }

  function makeValueOption(v: Value) {
    return { label: v.value, value: v.id };
  }

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  const INITIAL_VALUES = {
    addressFlags: currentResult.addressFlags?.map((v) => v.id) ?? [],
  };

  return (
    <Modal
      title={t("manageAddressFlags")}
      isOpen={modalState.isOpen(ModalIds.ManageAddressFlags)}
      onClose={() => modalState.closeModal(ModalIds.ManageAddressFlags)}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors, isValid }) => (
          <Form autoComplete="off">
            <SelectField
              errorMessage={errors.addressFlags as string}
              label={cT("addressFlags")}
              selectionMode="multiple"
              options={addressFlag.values.map(makeValueOption)}
              selectedKeys={values.addressFlags}
              onSelectionChange={(keys) => setFieldValue("flags", keys)}
            />

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.ManageAddressFlags)}
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
