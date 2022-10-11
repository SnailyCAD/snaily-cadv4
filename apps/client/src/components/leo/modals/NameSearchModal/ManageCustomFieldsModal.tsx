import * as React from "react";
import { FormField } from "components/form/FormField";
import { Button, Input } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { classNames } from "lib/classNames";
import type { CustomField, CustomFieldCategory, CustomFieldValue } from "@snailycad/types";
import type {
  PutSearchActionsUpdateCitizenCustomFields,
  PutSearchActionsUpdateVehicleCustomFields,
  PutSearchActionsUpdateWeaponCustomFields,
} from "@snailycad/types/api";

type CustomFieldResults =
  | PutSearchActionsUpdateWeaponCustomFields
  | PutSearchActionsUpdateVehicleCustomFields
  | PutSearchActionsUpdateCitizenCustomFields;

interface Props {
  category: CustomFieldCategory;
  url: `/search/actions/custom-fields/${Lowercase<CustomFieldCategory>}/${string}`;
  allCustomFields: CustomField[];
  customFields: CustomFieldValue[];
  onUpdate(newResults: CustomFieldResults): void;
}

export function ManageCustomFieldsModal({
  url,
  category,
  allCustomFields,
  customFields,
  onUpdate,
}: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<CustomFieldResults>({
      path: url,
      method: "PUT",
      data: { fields: values },
    });

    if (json.id) {
      onUpdate(json);
      closeModal(ModalIds.ManageCitizenCustomFields);
    }
  }

  const fieldsForCategory = React.useMemo(
    () => allCustomFields.filter((v) => v.category === category),
    [category, allCustomFields],
  );
  const makeInitialValues = React.useCallback(() => {
    const objFields: Record<
      string,
      { fieldId: string; valueId: string | undefined; value: string | null }
    > = {};
    for (const field of allCustomFields) {
      if (field.category !== category) continue;
      const value = customFields.find((v) => v.fieldId === field.id);

      objFields[field.name] = {
        fieldId: field.id,
        valueId: value?.id,
        value: value?.value ?? null,
      };
    }

    return objFields;
  }, [allCustomFields, customFields, category]);

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
                fieldsForCategory.length >= 2 && "grid grid-cols-1 md:grid-cols-2 gap-3",
              )}
            >
              {fieldsForCategory.map((field) => {
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
                onPress={() => closeModal(ModalIds.ManageCitizenCustomFields)}
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
