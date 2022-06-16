import { TOW_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/inputs/Input";
import { Select } from "components/form/Select";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik, useFormikContext } from "formik";
import { handleValidate } from "lib/handleValidate";
import { toastMessage } from "lib/toastMessage";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import type { Full911Call } from "state/dispatchState";
import { useEmsFdState } from "state/emsFdState";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import type { VehicleSearchResult } from "state/search/vehicleSearchState";
import { useAsyncValues } from "hooks/useAsyncValues";
import { ValueType } from "@snailycad/types";

interface Props {
  call: Full911Call | null;
}

export function DispatchCallTowModal({ call }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const { isOpen, closeModal, getPayload } = useModal();
  const { state, execute } = useFetch();
  const { activeOfficer, officers } = useLeoState();
  const { activeDeputy, deputies } = useEmsFdState();
  const router = useRouter();
  const { impoundLot } = useValues();
  useAsyncValues({ valueTypes: [ValueType.IMPOUND_LOT] });

  const isLeo = router.pathname === "/officer";
  const isDispatch = router.pathname === "/dispatch";
  const citizensFrom = isLeo ? officers : router.pathname === "/ems-fd" ? deputies : [];
  const citizens = [...citizensFrom].map((v) => v.citizen);
  const unit = isLeo ? activeOfficer : router.pathname === "/ems-fd" ? activeDeputy : null;

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const payload = getPayload<{ call911Id: string }>(ModalIds.ManageTowCall);
    const { json } = await execute("/tow", {
      method: "POST",
      data: { ...values, ...payload, creatorId: values.creatorId || null },
    });

    if (json.id) {
      toastMessage({
        title: common("success"),
        message: t("Calls.towCallCreated"),
        icon: "success",
      });
    }

    closeModal(ModalIds.ManageTowCall);
  }

  const validate = handleValidate(TOW_SCHEMA);
  const INITIAL_VALUES = {
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    // @ts-expect-error TS should allow this tbh!
    creatorId: unit?.citizenId ?? null,
    description: call?.description ?? "",
    callCountyService: false,
    deliveryAddress: "",
    model: "",
    plate: "",
    plateOrVin: "",
  };

  return (
    <Modal
      onClose={() => closeModal(ModalIds.ManageTowCall)}
      title={t("Calls.createTowCall")}
      isOpen={isOpen(ModalIds.ManageTowCall)}
      className="w-[700px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, values, isValid, errors }) => (
          <Form>
            {unit ? (
              <FormField errorMessage={errors.creatorId as string} label={t("Calls.citizen")}>
                <Select
                  disabled
                  name="creatorId"
                  onChange={handleChange}
                  values={citizens.map((citizen) => ({
                    label: `${citizen.name} ${citizen.surname}`,
                    value: citizen.id,
                  }))}
                  value={values.creatorId || null}
                />
              </FormField>
            ) : null}

            <FormRow>
              <FormField errorMessage={errors.location} label={t("Calls.location")}>
                <Input name="location" value={values.location} onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.postal} label={t("Calls.postal")}>
                <Input name="postal" value={values.postal} onChange={handleChange} />
              </FormField>
            </FormRow>

            {isLeo || isDispatch ? (
              <>
                <FormField
                  optional
                  errorMessage={errors.deliveryAddress}
                  label={t("Calls.deliveryAddress")}
                >
                  <Select
                    isClearable
                    name="deliveryAddress"
                    onChange={handleChange}
                    values={impoundLot.values.map((lot) => ({
                      label: lot.value,
                      value: lot.id,
                    }))}
                    value={values.deliveryAddress}
                  />
                </FormField>

                <FormField optional errorMessage={errors.plate} label={t("Vehicles.plate")}>
                  <InputSuggestions<VehicleSearchResult>
                    onSuggestionClick={(suggestion) => {
                      setFieldValue("plate", suggestion.plate);
                      setFieldValue("model", suggestion.model.value.value);
                    }}
                    Component={({ suggestion }) => (
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
                      value: values.plate,
                      name: "plate",
                      onChange: (e) => {
                        handleChange(e);
                        setFieldValue("plateOrVin", e.target.value);
                      },
                    }}
                  />
                </FormField>

                <FormField optional errorMessage={errors.model} label={t("Vehicles.model")}>
                  <Input onChange={handleChange} name="model" value={values.model} />
                </FormField>
              </>
            ) : null}

            <FormField
              errorMessage={errors.callCountyService}
              checkbox
              label={t("Calls.callCountyService")}
            >
              <Input
                type="checkbox"
                name="callCountyService"
                onChange={() => setFieldValue("callCountyService", !values.callCountyService)}
                checked={values.callCountyService}
                className="w-[max-content] ml-1"
              />
            </FormField>

            <FormField errorMessage={errors.description} label={common("description")}>
              <Textarea name="description" onChange={handleChange} value={values.description} />
            </FormField>

            <ImpoundLocationInfo />

            <footer className="flex justify-end mt-5">
              <div className="flex items-center">
                <Button
                  type="reset"
                  onClick={() => closeModal(ModalIds.ManageTowCall)}
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
                  {common("create")}
                </Button>
              </div>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

function ImpoundLocationInfo() {
  const t = useTranslations("Leo");
  const { values } = useFormikContext<{ plate: string | null; deliveryAddress: string | null }>();
  const { impoundLot } = useValues();
  const deliveryAddress =
    values.deliveryAddress && impoundLot.values.find((v) => v.id === values.deliveryAddress);

  return values.plate && deliveryAddress ? (
    <p className="text-base italic">
      {t("vehicleImpoundLocation", {
        plate: values.plate,
        impoundLocation: deliveryAddress.value,
      })}
    </p>
  ) : null;
}
