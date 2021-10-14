import * as React from "react";
import { Tab } from "@headlessui/react";
import { useTranslations } from "use-intl";
import { useBusinessState } from "state/businessState";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Form, Formik } from "formik";
import { CREATE_COMPANY_SCHEMA } from "@snailycad/schemas";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Error } from "components/form/Error";
import { handleValidate } from "lib/handleValidate";
import { Toggle } from "components/form/Toggle";
import { Button } from "components/Button";
import { Loader } from "components/Loader";
import { useRouter } from "next/router";

export const ManageBusinessTab = () => {
  const { state, execute } = useFetch();
  const { openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const router = useRouter();

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState();

  if (!currentBusiness) {
    return null;
  }

  async function handleDeleteBusiness() {
    if (!currentBusiness) return;

    const { json } = await execute(`/businesses/${currentBusiness.id}`, {
      method: "DELETE",
      data: { employeeId: currentEmployee?.id },
    });

    if (json) {
      router.push("/business");
      setCurrentBusiness(null);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentBusiness) return;

    const { json } = await execute(`/businesses/${currentBusiness.id}`, {
      method: "PUT",
      data: { ...values, employeeId: currentEmployee?.id },
    });

    if (json.id) {
      setCurrentBusiness({ ...currentBusiness, ...json });
    }
  }

  const validate = handleValidate(CREATE_COMPANY_SCHEMA);
  const INITIAL_VALUES = {
    name: currentBusiness.name,
    address: currentBusiness.address,
    ownerId: currentBusiness.citizenId,
    whitelisted: currentBusiness.whitelisted,
  };

  return (
    <Tab.Panel className="mt-3">
      <h3 className="text-2xl font-semibold">{t("business")}</h3>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField fieldId="name" label={t("name")}>
              <Input
                id="name"
                onChange={handleChange}
                hasError={!!errors.name}
                value={values.name}
              />
              <Error>{errors.name}</Error>
            </FormField>

            <FormField fieldId="address" label={t("address")}>
              <Input
                id="address"
                onChange={handleChange}
                hasError={!!errors.address}
                value={values.address}
              />
              <Error>{errors.address}</Error>
            </FormField>

            <FormField fieldId="whitelisted" label={t("whitelisted")}>
              <Toggle name="whitelisted" onClick={handleChange} toggled={values.whitelisted} />
              <Error>{errors.whitelisted}</Error>
            </FormField>

            <footer className="mt-5 flex justify-between">
              <Button
                onClick={() => openModal(ModalIds.AlertDeleteBusiness)}
                type="reset"
                variant="danger"
              >
                {t("deleteBusiness")}
              </Button>

              <div className="flex">
                <Button type="reset" variant="cancel">
                  {common("cancel")}
                </Button>
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {common("save")}
                </Button>
              </div>
            </footer>
          </Form>
        )}
      </Formik>

      <AlertModal
        id={ModalIds.AlertDeleteBusiness}
        title={t("deleteBusiness")}
        description={t.rich("alert_deleteBusiness", {
          business: currentBusiness.name,
          span: (children) => <span className="font-semibold">{children}</span>,
        })}
        deleteText={t("deleteBusiness")}
        state={state}
        onDeleteClick={handleDeleteBusiness}
      />
    </Tab.Panel>
  );
};
