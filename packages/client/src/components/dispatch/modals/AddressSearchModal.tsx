import * as React from "react";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Input } from "components/form/Input";
import { Citizen } from "types/prisma";

export const AddressSearchModal = () => {
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
    openModal(ModalIds.NameSearch, citizen);
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
      className="min-w-[800px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("enterAddress")} fieldId="address">
              <Input
                value={values.address}
                hasError={!!errors.address}
                id="address"
                onChange={handleChange}
              />
              <Error>{errors.address}</Error>
            </FormField>

            {typeof results === "boolean" && results !== null ? <p>{t("noResults")}</p> : null}

            {typeof results !== "boolean" && results ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                <div className="overflow-x-auto w-full mt-3">
                  <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
                    <thead>
                      <tr>
                        <th>{t("citizen")}</th>
                        <th>{t("fullAddress")}</th>
                        <th>{common("actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((citizen) => (
                        <tr key={citizen.id}>
                          <td>
                            {citizen.name} {citizen.surname}
                          </td>
                          <td>{citizen.address}</td>
                          <td className="w-36">
                            <Button
                              type="button"
                              onClick={() => handleOpen(citizen)}
                              small
                              variant="success"
                            >
                              {t("viewInNameSearch")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <footer className="mt-5 flex justify-end">
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
};

type AddressSearchResult = Citizen[];
