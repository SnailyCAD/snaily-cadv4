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
import { useNameSearch } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";
import type { PutSearchActionsCitizenFlagsData } from "@snailycad/types/api";

export function ManageCitizenFlagsModal() {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const veh = useTranslations("Vehicles");
  const { currentResult, setCurrentResult } = useNameSearch();
  const { citizenFlag } = useValues();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsCitizenFlagsData>({
      path: `/search/actions/citizen-flags/${currentResult.id}`,
      method: "PUT",
      data: { flags: values.flags.map((v) => v.value) },
    });

    if (json.flags) {
      setCurrentResult({ ...currentResult, ...json });
      closeModal(ModalIds.ManageCitizenFlags);
    }
  }

  function makeValueOption(v: Value) {
    return { label: v.value, value: v.id };
  }

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  const INITIAL_VALUES = {
    flags: currentResult.flags?.map(makeValueOption) ?? [],
  };

  return (
    <Modal
      title={t("manageCitizenFlags")}
      isOpen={isOpen(ModalIds.ManageCitizenFlags)}
      onClose={() => closeModal(ModalIds.ManageCitizenFlags)}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.flags as string} label={veh("flags")}>
              <Select
                isMulti
                values={citizenFlag.values.map(makeValueOption)}
                name="flags"
                onChange={handleChange}
                value={values.flags}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onPress={() => closeModal(ModalIds.ManageCitizenFlags)}
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
