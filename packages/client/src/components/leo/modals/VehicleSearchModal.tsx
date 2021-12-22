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
import { useRouter } from "next/router";

export function VehicleSearchModal() {
  const [results, setResults] = React.useState<VehicleSearchResult | null | boolean>(null);

  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const vT = useTranslations("Vehicles");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const router = useRouter();
  const isLeo = router.pathname === "/officer";
  const showMarkStolen =
    results && typeof results !== "boolean" && isLeo && !results.reportedStolen;

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

  async function handleMarkStolen() {
    if (!results || typeof results === "boolean") return;

    const { json } = await execute(`/bolos/mark-stolen/${results.id}`, {
      method: "POST",
      data: results,
    });

    if (json) {
      // @ts-expect-error ignore
      setResults((p) => ({ ...p, reportedStolen: true }));
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
      className="w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("plateOrVin")}>
              <Input
                value={values.plateOrVin}
                hasError={!!errors.plateOrVin}
                name="plateOrVin"
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

                {results.reportedStolen ? (
                  <div className="p-2 mt-2 font-semibold text-black rounded-md bg-amber-500">
                    {t("vehicleReportedStolen")}
                  </div>
                ) : null}

                <ul className="mt-2">
                  <li>
                    <span className="font-semibold">{vT("plate")}: </span>
                    {results.plate.toUpperCase()}
                  </li>
                  <li>
                    <span className="font-semibold">{vT("model")}: </span>
                    {results.model.value.value}
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

            <footer className={`mt-5 flex ${showMarkStolen ? "justify-between" : "justify-end"}`}>
              {showMarkStolen ? (
                <div>
                  <Button
                    type="button"
                    onClick={() => handleMarkStolen()}
                    variant="cancel"
                    className="px-1.5"
                  >
                    {vT("reportAsStolen")}
                  </Button>
                </div>
              ) : null}

              <div className="flex">
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
              </div>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

interface VehicleSearchResult extends RegisteredVehicle {
  citizen: Citizen;
  registrationStatus: Value<"LICENSE">;
}
