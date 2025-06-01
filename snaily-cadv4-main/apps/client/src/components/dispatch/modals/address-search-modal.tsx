import * as React from "react";
import { Loader, Button, AsyncListSearchField, Item } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { Table, useTableState } from "components/shared/Table";
import { formatCitizenAddress } from "lib/utils";
import type { PostDispatchAddressSearchData } from "@snailycad/types/api";

export function AddressSearchModal() {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const tableState = useTableState();

  const [results, setResults] = React.useState<AddressSearchResult | null | boolean>(null);

  React.useEffect(() => {
    if (!modalState.isOpen(ModalIds.AddressSearch)) {
      setResults(null);
    }
  }, [modalState]);

  function handleOpen(citizen: AddressSearchResult[number]) {
    modalState.closeModal(ModalIds.AddressSearch);
    modalState.openModal(ModalIds.NameSearch, {
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
    searchValue: "",
    address: "",
  };

  return (
    <Modal
      title={t("addressSearch")}
      onClose={() => modalState.closeModal(ModalIds.AddressSearch)}
      isOpen={modalState.isOpen(ModalIds.AddressSearch)}
      className="w-[800px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setValues, setFieldValue, errors, values, isValid }) => (
          <Form>
            <AsyncListSearchField<AddressSearchResult[number]>
              allowsCustomValue
              autoFocus
              onInputChange={(value) => setFieldValue("searchValue", value)}
              onSelectionChange={(node) => {
                if (node?.value) {
                  setValues({
                    ...values,
                    searchValue: node.value.address,
                    address: node.key as string,
                  });

                  setResults([node.value]);
                }
              }}
              localValue={values.searchValue}
              errorMessage={errors.address}
              label={t("enterAddress")}
              selectedKey={values.address}
              fetchOptions={{
                apiPath: "/search/address",
                method: "POST",
                bodyKey: "address",
                filterTextRequired: true,
              }}
            >
              {(item) => (
                <Item key={item.address} textValue={item.address}>
                  {item.address} ({item.name} {item.surname})
                </Item>
              )}
            </AsyncListSearchField>

            {typeof results === "boolean" ? <p>{t("noResults")}</p> : null}

            {typeof results !== "boolean" && results ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                <Table
                  features={{ isWithinCardOrModal: true }}
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
                onPress={() => modalState.closeModal(ModalIds.AddressSearch)}
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
