import * as React from "react";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Table, useTableState } from "components/shared/Table";
import { formatCitizenAddress } from "lib/utils";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import type { PostDispatchAddressSearchData } from "@snailycad/types/api";

export function AddressSearchModal() {
  const { isOpen, closeModal, openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const tableState = useTableState();

  const [results, setResults] = React.useState<AddressSearchResult | null | boolean>(null);

  React.useEffect(() => {
    if (!isOpen(ModalIds.AddressSearch)) {
      setResults(null);
    }
  }, [isOpen]);

  function handleOpen(citizen: AddressSearchResult[number]) {
    closeModal(ModalIds.AddressSearch);
    openModal(ModalIds.NameSearch, {
      ...citizen,
      name: `${citizen.name} ${citizen.surname}`,
    });
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<AddressSearchResult>({
      path: "/search/address",
      method: "POST",
      data: values,
      noToast: true,
    });

    if (Array.isArray(json)) {
      setResults(json);
    } else {
      setResults(false);
    }
  }

  const INITIAL_VALUES = {
    address: "",
  };

  return (
    <Modal
      title={t("addressSearch")}
      onClose={() => closeModal(ModalIds.AddressSearch)}
      isOpen={isOpen(ModalIds.AddressSearch)}
      className="w-[800px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.address} label={t("enterAddress")}>
              <InputSuggestions<AddressSearchResult[number]>
                onSuggestionPress={(suggestion) => {
                  setFieldValue("address", suggestion.address);
                  setResults([suggestion]);
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    {suggestion.address} ({suggestion.name} {suggestion.surname})
                  </div>
                )}
                options={{
                  apiPath: "/search/address",
                  method: "POST",
                  dataKey: "address",
                }}
                inputProps={{
                  value: values.address,
                  name: "address",
                  onChange: handleChange,
                }}
              />
            </FormField>

            {typeof results === "boolean" ? <p>{t("noResults")}</p> : null}

            {typeof results !== "boolean" && results ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                <Table
                  features={{ isWithinCard: true }}
                  tableState={tableState}
                  data={results.map((result) => ({
                    id: result.id,
                    citizen: `${result.name} ${result.surname}`,
                    fullAddress: formatCitizenAddress(result),
                    actions: (
                      <Button type="button" onPress={() => handleOpen(result)} size="xs">
                        {t("viewInNameSearch")}
                      </Button>
                    ),
                  }))}
                  columns={[
                    { header: t("citizen"), accessorKey: "citizen" },
                    { header: t("fullAddress"), accessorKey: "fullAddress" },
                    { header: common("actions"), accessorKey: "actions" },
                  ]}
                />
              </div>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.AddressSearch)}
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

type AddressSearchResult = PostDispatchAddressSearchData;
