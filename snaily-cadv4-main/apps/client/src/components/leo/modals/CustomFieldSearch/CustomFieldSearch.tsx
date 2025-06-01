import * as React from "react";
import { Loader, Button, TextField, SelectField, FormRow } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { CustomFieldResults } from "./CustomFieldResults";
import { handleValidate } from "lib/handleValidate";
import { CUSTOM_FIELD_SEARCH_SCHEMA } from "@snailycad/schemas";
import type { GetManageCustomFieldsData, PostSearchCustomFieldData } from "@snailycad/types/api";
import { useQuery } from "@tanstack/react-query";

export type CustomFieldResults = PostSearchCustomFieldData<true>;

export function CustomFieldSearch() {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const [results, setResults] = React.useState<CustomFieldResults | null>(null);

  const { data: customFieldsData, isLoading } = useQuery({
    refetchOnWindowFocus: false,
    initialData: { customFields: [], totalCount: 0 },
    queryKey: ["custom-fields"],
    queryFn: async () => {
      const { json } = await execute<GetManageCustomFieldsData>({
        path: "/admin/manage/custom-fields?includeAll=true",
        method: "GET",
      });

      return json;
    },
  });

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<CustomFieldResults>({
      path: "/search/custom-field",
      method: "POST",
      data: values,
    });

    if (json.results) {
      setResults(json);
    }
  }

  const validate = handleValidate(CUSTOM_FIELD_SEARCH_SCHEMA);
  const INITIAL_VALUES = {
    query: "",
    customFieldId: null,
  };

  return (
    <Modal
      title={t("customFieldSearch")}
      onClose={() => modalState.closeModal(ModalIds.CustomFieldSearch)}
      isOpen={modalState.isOpen(ModalIds.CustomFieldSearch)}
      className="w-[850px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <FormRow useFlex>
              <SelectField
                isLoading={isLoading}
                isDisabled={isLoading}
                errorMessage={errors.customFieldId}
                label={t("customField")}
                options={customFieldsData.customFields.map((field) => ({
                  value: field.id,
                  label: field.name,
                }))}
                onSelectionChange={(value) => setFieldValue("customFieldId", value)}
                selectedKey={values.customFieldId}
                className="w-64"
              />

              <TextField
                label={t("query")}
                className="w-full relative"
                name="query"
                onChange={(value) => setFieldValue("query", value)}
                value={values.query}
              />
            </FormRow>

            {results ? <CustomFieldResults results={results} /> : null}

            <footer className="mt-4 pt-3 flex justify-end">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.CustomFieldSearch)}
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
                {common("search")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
