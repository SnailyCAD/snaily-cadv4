import { useTranslations } from "use-intl";
import { useBusinessState } from "state/business-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Form, Formik } from "formik";
import { CREATE_COMPANY_SCHEMA } from "@snailycad/schemas";
import { Button, Loader, Input, TabsContent } from "@snailycad/ui";
import { handleValidate } from "lib/handleValidate";
import { Toggle } from "components/form/Toggle";
import { useRouter } from "next/router";
import { SettingsFormField } from "components/form/SettingsFormField";
import type { DeleteBusinessByIdData, PutBusinessByIdData } from "@snailycad/types/api";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { shallow } from "zustand/shallow";

export function ManageBusinessTab() {
  const { state, execute } = useFetch();
  const { openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const router = useRouter();

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState(
    (state) => ({
      currentBusiness: state.currentBusiness,
      currentEmployee: state.currentEmployee,
      setCurrentBusiness: state.setCurrentBusiness,
    }),
    shallow,
  );

  if (!currentBusiness) {
    return null;
  }

  async function handleDeleteBusiness() {
    if (!currentBusiness) return;

    const { json } = await execute<DeleteBusinessByIdData>({
      path: `/businesses/${currentBusiness.id}`,
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

    const { json } = await execute<PutBusinessByIdData>({
      path: `/businesses/${currentBusiness.id}`,
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
          <Form className="mt-3">
            <SettingsFormField
              description={t("nameDescription")}
              errorMessage={errors.name}
              label={t("name")}
            >
              <Input name="name" onChange={handleChange} value={values.name} />
            </SettingsFormField>

            <SettingsFormField
              description={t("addressDescription")}
              errorMessage={errors.address}
              label={t("address")}
            >
              <AddressPostalSelect />
            </SettingsFormField>

            <SettingsFormField
              action="checkbox"
              description={t("whitelistDescription")}
              errorMessage={errors.whitelisted}
              label={t("whitelisted")}
            >
              <Toggle
                name="whitelisted"
                onCheckedChange={handleChange}
                value={values.whitelisted}
              />
            </SettingsFormField>

            <footer className="flex justify-between mt-5">
              <Button
                onPress={() => openModal(ModalIds.AlertDeleteBusiness)}
                type="reset"
                variant="danger"
              >
                {t("deleteBusiness")}
              </Button>

              <div className="flex">
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
        })}
        deleteText={t("deleteBusiness")}
        state={state}
        onDeleteClick={handleDeleteBusiness}
      />
    </TabsContent>
  );
}
