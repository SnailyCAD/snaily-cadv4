import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { useBusinessState } from "state/businessState";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Form, Formik } from "formik";
import { CREATE_COMPANY_SCHEMA } from "@snailycad/schemas";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { handleValidate } from "lib/handleValidate";
import { Toggle } from "components/form/Toggle";
import { Button } from "components/Button";
import { Loader } from "components/Loader";
import { useRouter } from "next/router";
import { FormRow } from "components/form/FormRow";

export function ManageBusinessTab() {
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
    postal: currentBusiness.postal ?? "",
    ownerId: currentBusiness.citizenId,
    whitelisted: currentBusiness.whitelisted,
  };

  return (
    <TabsContent aria-label={t("business")} value="business">
      <h3 className="text-2xl font-semibold">{t("business")}</h3>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.name} label={t("name")}>
              <Input name="name" onChange={handleChange} value={values.name} />
            </FormField>

            <FormRow flexLike>
              <FormField className="w-full" errorMessage={errors.address} label={t("address")}>
                <Input
                  className="w-full"
                  name="address"
                  onChange={handleChange}
                  value={values.address}
                />
              </FormField>

              <FormField optional errorMessage={errors.postal} label={common("postal")}>
                <Input
                  className="min-w-[200px]"
                  name="postal"
                  onChange={handleChange}
                  value={values.postal}
                />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.whitelisted} label={t("whitelisted")}>
              <Toggle name="whitelisted" onClick={handleChange} toggled={values.whitelisted} />
            </FormField>

            <footer className="flex justify-between mt-5">
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
    </TabsContent>
  );
}
