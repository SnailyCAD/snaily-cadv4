import { TOW_SCHEMA } from "@snailycad/schemas";
import { Loader, Input, Button, TextField, AsyncListSearchField, Item } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik, useFormikContext } from "formik";
import { handleValidate } from "lib/handleValidate";
import { toastMessage } from "lib/toastMessage";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { useEmsFdState } from "state/ems-fd-state";
import { useLeoState } from "state/leo-state";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import type { VehicleSearchResult } from "state/search/vehicle-search-state";
import { Checkbox } from "components/form/inputs/Checkbox";
import type { PostTowCallsData } from "@snailycad/types/api";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { useUserOfficers } from "hooks/leo/use-get-user-officers";
import { useGetUserDeputies } from "hooks/ems-fd/use-get-user-deputies";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";

interface Props {
  call: Full911Call | null;
}

export function DispatchCallTowModal({ call }: Props) {
  const router = useRouter();

  const isLeo = router.pathname === "/officer";
  const isDispatch = router.pathname === "/dispatch";
  const isEmsFd = router.pathname === "/ems-fd";

  const common = useTranslations("Common");
  const t = useTranslations();
  const { isOpen, closeModal, getPayload } = useModal();
  const { impoundLot } = useValues();
  const { state, execute } = useFetch();

  const { userOfficers, isLoading: officersLoading } = useUserOfficers({ enabled: isLeo });
  const { userDeputies, isLoading: deputiesLoading } = useGetUserDeputies({ enabled: isEmsFd });
  const isLoading = isLeo ? officersLoading : isEmsFd ? deputiesLoading : false;

  const activeDeputy = useEmsFdState((state) => state.activeDeputy);
  const activeOfficer = useLeoState((state) => state.activeOfficer);

  const activeUnit = isLeo ? activeOfficer : isEmsFd ? activeDeputy : null;

  const citizensFrom = isLeo ? userOfficers : isEmsFd ? userDeputies : [];
  const citizens = [...citizensFrom].map((v) => v.citizen);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const payload = getPayload<{ call911Id: string }>(ModalIds.ManageTowCall);
    const { json } = await execute<PostTowCallsData>({
      path: "/tow",
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
  const isCombined = activeUnit && (isUnitCombined(activeUnit) || isUnitCombinedEmsFd(activeUnit));

  const INITIAL_VALUES = {
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    creatorId: isCombined ? null : activeUnit?.citizenId ?? null,
    description: call?.description ?? "",
    descriptionData: call?.descriptionData ?? null,
    callCountyService: false,
    deliveryAddressId: "",
    model: "",
    plateSearch: "",
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
        {({ handleChange, setValues, setFieldValue, values, isValid, errors }) => (
          <Form>
            {activeUnit ? (
              <FormField errorMessage={errors.creatorId as string} label={t("Calls.citizen")}>
                <Select
                  isLoading={isLoading}
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

            <AddressPostalSelect addressLabel="location" />

            {isLeo || isDispatch ? (
              <>
                <FormField
                  optional
                  errorMessage={errors.deliveryAddressId}
                  label={t("Calls.deliveryAddress")}
                >
                  <Select
                    isClearable
                    name="deliveryAddressId"
                    onChange={handleChange}
                    values={impoundLot.values.map((lot) => ({
                      label: lot.value,
                      value: lot.id,
                    }))}
                    value={values.deliveryAddressId}
                  />
                </FormField>

                <AsyncListSearchField<VehicleSearchResult>
                  label={t("Vehicles.plate")}
                  errorMessage={errors.plate}
                  isOptional
                  fetchOptions={{
                    apiPath: "/search/vehicle?includeMany=true",
                    method: "POST",
                    bodyKey: "plateOrVin",
                    filterTextRequired: true,
                  }}
                  allowsCustomValue
                  localValue={values.plateSearch}
                  setValues={({ node, localValue }) => {
                    const vehicle = node
                      ? { plate: node.value.plate, model: node.value.model.value.value }
                      : {};

                    setValues({
                      ...values,
                      ...vehicle,
                      plateSearch: localValue ?? node?.value.plate ?? "",
                    });
                  }}
                >
                  {(item) => (
                    <Item textValue={item.plate} key={item.plate}>
                      {item.plate.toUpperCase()} ({item.model.value.value.toUpperCase()})
                    </Item>
                  )}
                </AsyncListSearchField>

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
              <Checkbox
                name="callCountyService"
                onChange={() => setFieldValue("callCountyService", !values.callCountyService)}
                checked={values.callCountyService}
                className="w-[max-content] ml-1"
              />
            </FormField>

            <TextField
              isTextarea
              errorMessage={errors.description}
              label={common("description")}
              name="description"
              onChange={(value) => setFieldValue("description", value)}
              value={values.description}
            />

            <ImpoundLocationInfo />

            <footer className="flex justify-end mt-5">
              <div className="flex items-center">
                <Button
                  type="reset"
                  onPress={() => closeModal(ModalIds.ManageTowCall)}
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
