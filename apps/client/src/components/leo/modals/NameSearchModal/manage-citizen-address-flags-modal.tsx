import type { Value } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/ModalIds";
import type { PutSearchActionsCitizenAddressFlagsData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";

export function ManageCitizenAddressFlagsModal() {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const cT = useTranslations("Citizen");
  const { currentResult, setCurrentResult } = useNameSearch(
    (state) => ({
      currentResult: state.currentResult,
      setCurrentResult: state.setCurrentResult,
    }),
    shallow,
  );
  const { addressFlag } = useValues();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsCitizenAddressFlagsData>({
      path: `/search/actions/citizen-address-flags/${currentResult.id}`,
      method: "PUT",
      data: { addressFlags: values.addressFlags.map((v) => v.value) },
    });

    if (json.addressFlags) {
      setCurrentResult({ ...currentResult, ...json });
      closeModal(ModalIds.ManageAddressFlags);
    }
  }

  function makeValueOption(v: Value) {
    return { label: v.value, value: v.id };
  }

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  const INITIAL_VALUES = {
    addressFlags: currentResult.addressFlags?.map(makeValueOption) ?? [],
  };

  return (
    <Modal
      title={t("manageAddressFlags")}
      isOpen={isOpen(ModalIds.ManageAddressFlags)}
      onClose={() => closeModal(ModalIds.ManageAddressFlags)}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.addressFlags as string} label={cT("addressFlags")}>
              <Select
                isMulti
                values={addressFlag.values.map(makeValueOption)}
                name="addressFlags"
                onChange={handleChange}
                value={values.addressFlags}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onPress={() => closeModal(ModalIds.ManageAddressFlags)}
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
