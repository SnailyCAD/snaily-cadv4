import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Input } from "components/form/inputs/Input";
import type { Citizen } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { formatCitizenAddress } from "lib/utils";

export function AddressSearchModal() {
  const { isOpen, closeModal, openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();

  const [results, setResults] = React.useState<AddressSearchResult | null | boolean>(null);

  React.useEffect(() => {
    if (!isOpen(ModalIds.AddressSearch)) {
      setResults(null);
    }
  }, [isOpen]);

  function handleOpen(citizen: Citizen) {
    closeModal(ModalIds.AddressSearch);
    openModal(ModalIds.NameSearch, { name: `${citizen.name} ${citizen.surname}` });
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/search/address", {
      method: "POST",
      data: values,
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
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.address} label={t("enterAddress")}>
              <Input value={values.address} name="address" onChange={handleChange} />
            </FormField>

            {typeof results === "boolean" ? <p>{t("noResults")}</p> : null}

            {typeof results !== "boolean" && results ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                <Table
                  data={results.map((result) => ({
                    citizen: `${result.name} ${result.surname}`,
                    fullAddress: formatCitizenAddress(result),
                    actions: (
                      <Button
                        type="button"
                        onClick={() => handleOpen(result)}
                        small
                        variant="success"
                      >
                        {t("viewInNameSearch")}
                      </Button>
                    ),
                  }))}
                  columns={[
                    { Header: t("citizen"), accessor: "citizen" },
                    { Header: t("fullAddress"), accessor: "fullAddress" },
                    { Header: common("actions"), accessor: "actions" },
                  ]}
                />
              </div>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.AddressSearch)}
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

type AddressSearchResult = Citizen[];
