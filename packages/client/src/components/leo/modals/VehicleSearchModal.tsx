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
import type {
  Business,
  Citizen,
  RegisteredVehicle,
  TruckLog,
  Value,
  ValueType,
} from "@snailycad/types";
import { useRouter } from "next/router";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { yesOrNoText } from "lib/utils";
import { classNames } from "lib/classNames";
import { TruckLogsTable } from "./VehicleSearch/TruckLogsTable";
import { Infofield } from "components/shared/Infofield";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { FullDate } from "components/shared/FullDate";

export function VehicleSearchModal() {
  const [results, setResults] = React.useState<VehicleSearchResult | null | boolean>(null);

  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const vT = useTranslations("Vehicles");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const { BUSINESS } = useFeatureEnabled();
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
      data: {
        id: results.id,
        color: results.color,
        modelId: results.modelId,
        plate: results.plate,
      },
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
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.plateOrVin} label={t("plateOrVin")}>
              <InputSuggestions
                onSuggestionClick={(suggestion: VehicleSearchResult) => {
                  setFieldValue("plateOrVin", suggestion.vinNumber);
                  setResults(suggestion);
                }}
                Component={({ suggestion }: { suggestion: RegisteredVehicle }) => (
                  <div className="flex items-center">
                    <p>
                      {suggestion.plate.toUpperCase()} ({suggestion.vinNumber})
                    </p>
                  </div>
                )}
                options={{
                  apiPath: "/search/vehicle?includeMany=true",
                  method: "POST",
                  dataKey: "plateOrVin",
                }}
                inputProps={{
                  value: values.plateOrVin,
                  name: "plateOrVin",
                  onChange: handleChange,
                }}
              />
            </FormField>

            {typeof results === "boolean" ? <p>{t("vehicleNotFound")}</p> : null}

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
                    <Infofield label={vT("plate")}>{results.plate.toUpperCase()}</Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("model")}>{results.model.value.value}</Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("color")}> {results.color}</Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("vinNumber")}>{results.vinNumber}</Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("vinNumber")}>
                      {results.registrationStatus.value}
                    </Infofield>
                  </li>
                  <li>
                    <Infofield label={common("createdAt")}>
                      <FullDate>{results.createdAt}</FullDate>
                    </Infofield>
                  </li>
                  <li>
                    <Infofield className="capitalize" label={vT("owner")}>
                      {results.citizen.name} {results.citizen.surname}
                    </Infofield>
                  </li>
                  {BUSINESS ? (
                    <li>
                      <Infofield className="capitalize" label={vT("business")}>
                        {results.Business[0]?.name ?? common("none")}
                      </Infofield>
                    </li>
                  ) : null}
                  <li>
                    <Infofield
                      childrenProps={{
                        className: classNames(
                          "capitalize",
                          results.reportedStolen && "text-red-700 font-semibold",
                        ),
                      }}
                      label={t("reportedStolen")}
                    >
                      {common(yesOrNoText(results.reportedStolen))}
                    </Infofield>
                  </li>
                </ul>

                <TruckLogsTable results={results} />
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

export interface VehicleSearchResult extends RegisteredVehicle {
  citizen: Citizen;
  registrationStatus: Value<ValueType.LICENSE>;
  TruckLog: TruckLog[];
  Business: Business[];
}
