import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { Input } from "components/form/inputs/Input";
import type { RegisteredVehicle } from "@snailycad/types";
import { FormRow } from "components/form/FormRow";
import type { NameSearchResult } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";

interface Props {
  vehicle: RegisteredVehicle;
  onTransfer?(vehicle: RegisteredVehicle): void;
}

export function TransferVehicleModal({ onTransfer, vehicle }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Vehicles");
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute(`/vehicles/transfer/${vehicle.id}`, {
      method: "POST",
      data: values,
    });

    if (json.id) {
      onTransfer?.(json);
      closeModal(ModalIds.TransferVehicle);
    }
  }

  const INITIAL_VALUES = {
    ownerId: "",
    name: "",
  };

  return (
    <Modal
      title={t("transferVehicle")}
      onClose={() => closeModal(ModalIds.TransferVehicle)}
      isOpen={isOpen(ModalIds.TransferVehicle)}
      className="w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setValues, errors, values, isValid }) => (
          <Form>
            <p className="my-2 mb-5">
              {t.rich("transferVehicleInfo", {
                model: vehicle.model.value.value,
                span: (children) => <span className="font-semibold">{children}</span>,
              })}
            </p>

            <FormRow>
              <FormField label={t("plate")}>
                <Input disabled defaultValue={vehicle.plate} />
              </FormField>

              <FormField label={t("model")}>
                <Input disabled defaultValue={vehicle.model.value.value} />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.name} label={t("owner")}>
              <InputSuggestions<NameSearchResult>
                onSuggestionClick={(suggestion) => {
                  setValues({
                    ...values,
                    ownerId: suggestion.id,
                    name: `${suggestion.name} ${suggestion.surname}`,
                  });
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    <p>
                      {suggestion.name} {suggestion.surname}
                    </p>
                  </div>
                )}
                options={{
                  apiPath: "/search/name",
                  method: "POST",
                  dataKey: "name",
                  allowUnknown: true,
                }}
                inputProps={{
                  value: values.name,
                  name: "name",
                  onChange: handleChange,
                }}
              />
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.TransferVehicle)}
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
                {t("transfer")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
