import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useNameSearch } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";
import { classNames } from "lib/classNames";
import type { CustomField, CustomFieldCategory, CustomFieldValue } from "@snailycad/types";

interface Props {
  url: `/search/actions/custom-fields/${CustomFieldCategory}/${string}`;
  allCustomFields: CustomField[];
  customFields: CustomFieldValue[];
}

export function ManageCustomFieldsModal({ url, allCustomFields, customFields }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { currentResult, setCurrentResult } = useNameSearch();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute(url, {
      method: "PUT",
      data: { fields: values },
    });

    if (json.id) {
      setCurrentResult({
        ...currentResult,
        ...json,
      });
      closeModal(ModalIds.ManageCitizenCustomFields);
    }
  }

  const makeInitialValues = React.useCallback(() => {
    const fields = allCustomFields;
    const values = customFields;

    const objFields: Record<
      string,
      { fieldId: string; valueId: string | undefined; value: string | null }
    > = {};
    for (const field of fields) {
      const value = values.find((v) => v.fieldId === field.id);

      objFields[field.name] = {
        fieldId: field.id,
        valueId: value?.id,
        value: value?.value ?? null,
      };
    }

    return objFields;
  }, [allCustomFields, customFields]);

  if (!currentResult) {
    return null;
  }

  const INITIAL_VALUES = makeInitialValues();

  return (
    <Modal
      title={t("manageCustomFields")}
      isOpen={isOpen(ModalIds.ManageCitizenCustomFields)}
      onClose={() => closeModal(ModalIds.ManageCitizenCustomFields)}
      className="w-[700px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form autoComplete="off">
            <div
              className={classNames(
                allCustomFields.length >= 2 && "grid grid-cols-1 md:grid-cols-2 gap-3",
              )}
            >
              {allCustomFields.map((field) => {
                return (
                  <FormField
                    key={field.id}
                    errorMessage={errors[field.name] as string}
                    label={field.name}
                  >
                    <Input
                      value={values[field.name]?.value ?? ""}
                      onChange={handleChange}
                      name={`${field.name}.value`}
                    />
                  </FormField>
                );
              })}
            </div>

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onClick={() => closeModal(ModalIds.ManageCitizenCustomFields)}
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
