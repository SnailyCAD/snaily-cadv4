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
import { Citizen, RegisteredVehicle, Value } from "types/prisma";
import { format } from "date-fns";

export const VehicleSearchModal = () => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const vT = useTranslations("Vehicles");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();

  const [results, setResults] = React.useState<VehicleSearchResult | null | boolean>(null);

  React.useEffect(() => {
    if (!isOpen(ModalIds.VehicleSearch)) {
      setResults(null);
    }
  }, [isOpen]);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/search/vehicle", {
      method: "POST",
      data: values,
      noToast: true,
    });

    if (json.id) {
      setResults(json);
    } else {
      setResults(false);
    }
  }

  const INITIAL_VALUES = {
    plateOrVin: "",
  };

  return (
    <Modal
      title={t("plateSearch")}
      onClose={() => closeModal(ModalIds.VehicleSearch)}
      isOpen={isOpen(ModalIds.VehicleSearch)}
      className="min-w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("plateOrVin")} fieldId="plateOrVin">
              <Input
                value={values.plateOrVin}
                hasError={!!errors.plateOrVin}
                id="plateOrVin"
                onChange={handleChange}
              />
              <Error>{errors.plateOrVin}</Error>
            </FormField>

            {typeof results === "boolean" && results !== null ? (
              <p>{t("vehicleNotFound")}</p>
            ) : null}

            {typeof results !== "boolean" && results ? (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                <ul className="mt-2">
                  <li>
                    <span className="font-semibold">{vT("plate")}: </span>
                    {results.plate.toUpperCase()}
                  </li>
                  <li>
                    <span className="font-semibold">{vT("model")}: </span>
                    {results.model.value}
                  </li>
                  <li>
                    <span className="font-semibold">{vT("color")}: </span>
                    {results.color}
                  </li>
                  <li>
                    <span className="font-semibold">{vT("vinNumber")}: </span>
                    {results.vinNumber}
                  </li>
                  <li>
                    <span className="font-semibold">{vT("registrationStatus")}: </span>
                    {results.registrationStatus.value}
                  </li>
                  <li>
                    <span className="font-semibold">{common("createdAt")}: </span>
                    {format(new Date(results.createdAt), "yyyy-MM-dd HH:mm")}
                  </li>
                  <li>
                    <span className="font-semibold">{t("owner")}: </span>
                    <span className="capitalize">
                      {results.citizen.name} {results.citizen.surname}
                    </span>
                  </li>
                </ul>
              </div>
            ) : null}

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.VehicleSearch)}
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

interface VehicleSearchResult extends RegisteredVehicle {
  citizen: Citizen;
  model: Value<"VEHICLE">;
  registrationStatus: Value<"LICENSE">;
}
