import { TOW_SCHEMA } from "@snailycad/schemas";
import {
  Loader,
  Input,
  Button,
  TextField,
  AsyncListSearchField,
  Item,
  CheckboxField,
} from "@snailycad/ui";
import { FormField } from "components/form/FormField";
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
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import type { VehicleSearchResult } from "state/search/vehicle-search-state";
import type { PostTowCallsData } from "@snailycad/types/api";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { ValueType } from "@snailycad/types";

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
  const modalState = useModal();
  const { impoundLot } = useValues();
  const { state, execute } = useFetch();

  const activeDeputy = useEmsFdState((state) => state.activeDeputy);
  const activeOfficer = useLeoState((state) => state.activeOfficer);

  const activeUnit = isLeo ? activeOfficer : isEmsFd ? activeDeputy : null;

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const payload = modalState.getPayload<{ call911Id: string }>(ModalIds.ManageTowCall);
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

    modalState.closeModal(ModalIds.ManageTowCall);
  }

  const validate = handleValidate(TOW_SCHEMA);
  const isCombined = activeUnit && (isUnitCombined(activeUnit) || isUnitCombinedEmsFd(activeUnit));

  const INITIAL_VALUES = {
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    creatorId: isCombined ? null : (activeUnit?.citizenId ?? null),
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
      onClose={() => modalState.closeModal(ModalIds.ManageTowCall)}
      title={t("Calls.createTowCall")}
      isOpen={modalState.isOpen(ModalIds.ManageTowCall)}
      className="w-[700px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setValues, setFieldValue, values, isValid, errors }) => (
          <Form>
            <AddressPostalSelect addressLabel="location" />

            {isLeo || isDispatch ? (
              <>
                <ValueSelectField
                  valueType={ValueType.IMPOUND_LOT}
                  values={impoundLot.values}
                  isOptional
                  isClearable
                  fieldName="deliveryAddressId"
                  label={t("Calls.deliveryAddress")}
                />

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
                  onInputChange={(value) => setFieldValue("plateSearch", value)}
                  onSelectionChange={(node) => {
                    if (node?.value) {
                      const vehicle = {
                        plate: node.value.plate,
                        model: node.value.model.value.value,
                      };

                      setValues({
                        ...values,
                        ...vehicle,
                        plateSearch: node?.value?.plate ?? node.textValue,
                      });
                    }
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

            <CheckboxField
              onChange={(isSelected) => setFieldValue("callCountyService", isSelected)}
              isSelected={values.callCountyService}
            >
              {t("Calls.callCountyService")}
            </CheckboxField>

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
                  onPress={() => modalState.closeModal(ModalIds.ManageTowCall)}
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
