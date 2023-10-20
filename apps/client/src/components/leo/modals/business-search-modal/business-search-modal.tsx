import * as React from "react";
import { Loader, Button, AsyncListSearchField, Item, Infofield } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { Table, useTableState } from "components/shared/Table";
import { formatCitizenAddress } from "lib/utils";
import type { PostLeoSearchBusinessData } from "@snailycad/types/api";
import type { BaseCitizen } from "@snailycad/types";
import { type BusinessSearchResult, useBusinessSearch } from "state/search/business-search-state";
import dynamic from "next/dynamic";

const BusinessSearchTabsContainer = dynamic(
  async () => (await import("./tabs/tabs-container")).BusinessSearchTabsContainer,
  { ssr: false },
);

export function BusinessSearchModal() {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const tableState = useTableState();

  const payloadBusiness = modalState.getPayload<BusinessSearchResult | null>(
    ModalIds.BusinessSearch,
  );
  const { setCurrentResult, setResults, results, currentResult } = useBusinessSearch();

  React.useEffect(() => {
    if (!modalState.isOpen(ModalIds.BusinessSearch)) {
      setResults(null);
      setCurrentResult(null);
    }
  }, [modalState, setCurrentResult, setResults]);

  function handleOpenInNameSearch(citizen: Pick<BaseCitizen, "surname" | "name" | "id">) {
    modalState.closeModal(ModalIds.BusinessSearch);
    modalState.openModal(ModalIds.NameSearch, {
      ...citizen,
      name: `${citizen.name} ${citizen.surname}`,
    });
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostLeoSearchBusinessData>({
      path: "/search/business",
      method: "POST",
      data: { name: values.searchValue || values.name },
      noToast: true,
    });

    if (Array.isArray(json) && json.length <= 0) {
      setResults(false);
      setCurrentResult(null);
      return;
    }

    const first = Array.isArray(json) ? json[0] : json;

    if (first && (first?.id === currentResult?.id || first?.id === payloadBusiness?.id)) {
      setCurrentResult(first);
    }

    if (json && typeof json !== "boolean") {
      setResults(Array.isArray(json) ? json : [json]);
    } else {
      setResults(false);
      setCurrentResult(null);
    }
  }

  const INITIAL_VALUES = {
    searchValue: "",
    name: "",
  };

  return (
    <Modal
      title={t("businessSearch")}
      onClose={() => modalState.closeModal(ModalIds.BusinessSearch)}
      isOpen={modalState.isOpen(ModalIds.BusinessSearch)}
      className="w-[800px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setValues, setFieldValue, errors, values, isValid }) => (
          <Form>
            <AsyncListSearchField<PostLeoSearchBusinessData[number]>
              allowsCustomValue
              autoFocus
              onInputChange={(value) => setFieldValue("searchValue", value)}
              onSelectionChange={(node) => {
                if (node) {
                  setCurrentResult(node.value);

                  setValues({
                    ...values,
                    searchValue: node.value?.name ?? node.textValue,
                    name: node.key as string,
                  });
                }
              }}
              localValue={values.searchValue}
              errorMessage={errors.name}
              label={common("name")}
              selectedKey={values.name}
              fetchOptions={{
                apiPath: "/search/business",
                method: "POST",
                bodyKey: "name",
                filterTextRequired: true,
              }}
            >
              {(item) => (
                <Item key={item.id} textValue={item.name}>
                  {item.name}
                </Item>
              )}
            </AsyncListSearchField>

            {typeof results === "boolean" ? <p>{t("noResults")}</p> : null}

            {Array.isArray(results) && !currentResult ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                <Table
                  features={{ isWithinCardOrModal: true }}
                  tableState={tableState}
                  data={results.map((result) => ({
                    id: result.id,
                    name: result.name,
                    owners: result.employees
                      .filter((v) => v.role?.as === "OWNER")
                      .map((owner) => (
                        <Button
                          key={owner.id}
                          type="button"
                          onPress={() => handleOpenInNameSearch(owner.citizen)}
                          size="xs"
                        >
                          {owner.citizen.name} {owner.citizen.surname}
                        </Button>
                      )),
                    fullAddress: formatCitizenAddress(result),
                    actions: (
                      <Button size="sm" type="button" onPress={() => setCurrentResult(result)}>
                        {common("view")}
                      </Button>
                    ),
                  }))}
                  columns={[
                    { header: common("name"), accessorKey: "name" },
                    { header: t("owners"), accessorKey: "owners" },
                    { header: t("fullAddress"), accessorKey: "fullAddress" },
                    { header: common("actions"), accessorKey: "actions" },
                  ]}
                />
              </div>
            ) : null}

            {currentResult ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold mb-3">{t("results")}</h3>

                <Infofield label={common("name")}>{currentResult.name}</Infofield>
                <Infofield label={t("owners")}>
                  {currentResult.employees
                    .filter((v) => v.role?.as === "OWNER")
                    .map((owner) => (
                      <Button
                        key={owner.id}
                        size="xs"
                        type="button"
                        onPress={() => handleOpenInNameSearch(owner.citizen)}
                      >
                        {owner.citizen.name} {owner.citizen.surname}
                      </Button>
                    ))}
                </Infofield>
                <Infofield label={common("address")}>
                  {currentResult.address}{" "}
                  {currentResult.postal ? `(${currentResult.postal})` : null}
                </Infofield>

                <BusinessSearchTabsContainer />
              </div>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.BusinessSearch)}
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
