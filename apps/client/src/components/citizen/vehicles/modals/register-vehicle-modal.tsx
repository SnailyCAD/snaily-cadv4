import { useTranslations } from "use-intl";
import { Form, Formik, FormikHelpers } from "formik";
import { LEO_VEHICLE_SCHEMA, VEHICLE_SCHEMA } from "@snailycad/schemas";
import {
  Item,
  AsyncListSearchField,
  Button,
  Input,
  Loader,
  SelectField,
  TextField,
} from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useValues } from "src/context/ValuesContext";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import {
  RegisteredVehicle,
  ValueLicenseType,
  ValueType,
  VehicleValue,
  WhitelistStatus,
} from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { useRouter } from "next/router";
import { useAuth } from "context/AuthContext";
import { Toggle } from "components/form/Toggle";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useBusinessState } from "state/business-state";
import { filterLicenseType, filterLicenseTypes } from "lib/utils";
import { FormRow } from "components/form/FormRow";
import { useVehicleLicenses } from "hooks/locale/useVehicleLicenses";
import { toastMessage } from "lib/toastMessage";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { PostCitizenVehicleData, PutCitizenVehicleData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { Select } from "components/form/Select";

interface Props {
  vehicle: RegisteredVehicle | null;
  onCreate?(newV: RegisteredVehicle): void;
  onUpdate?(old: RegisteredVehicle, newV: RegisteredVehicle): void;
  onClose?(): void;
}

export function RegisterVehicleModal({ vehicle, onClose, onCreate, onUpdate }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Citizen");
  const tVehicle = useTranslations("Vehicles");
  const common = useTranslations("Common");
  const { citizen } = useCitizen(false);
  const router = useRouter();
  const { cad } = useAuth();
  const { CUSTOM_TEXTFIELD_VALUES, EDITABLE_VIN } = useFeatureEnabled();
  const { currentBusiness, currentEmployee } = useBusinessState(
    (state) => ({
      currentBusiness: state.currentBusiness,
      currentEmployee: state.currentEmployee,
    }),
    shallow,
  );

  const { INSPECTION_STATUS, TAX_STATUS } = useVehicleLicenses();

  const { vehicle: vehicles, license } = useValues();

  const isDisabled = router.pathname === "/citizen/[id]";
  const maxPlateLength = cad?.miscCadSettings?.maxPlateLength ?? 8;
  const isLeo = router.pathname.includes("/officer");

  const schema = isLeo ? LEO_VEHICLE_SCHEMA : VEHICLE_SCHEMA;
  const validate = handleValidate(schema);

  function handleClose() {
    closeModal(ModalIds.RegisterVehicle);
    onClose?.();
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const data = {
      ...values,
      modelValue: undefined,
      trimLevels: values.trimLevels.map((v) => v.value),
    };

    if (vehicle && !isLeo) {
      const { json } = await execute<PutCitizenVehicleData, typeof INITIAL_VALUES>({
        path: `/vehicles/${vehicle.id}`,
        method: "PUT",
        data,
        helpers,
      });

      if (json?.id) {
        onUpdate?.(vehicle, { ...vehicle, ...json });
      }
    } else {
      const path = isLeo ? "/search/actions/vehicle" : "/vehicles";
      const { json } = await execute<PostCitizenVehicleData, typeof INITIAL_VALUES>({
        path,
        method: "POST",
        data,
        helpers,
      });

      if (json?.id) {
        toastMessage({
          title: common("success"),
          message: tVehicle("successVehicleRegistered", { plate: values.plate.toUpperCase() }),
          icon: "success",
        });
        onCreate?.(json);
      }
    }
  }

  const INITIAL_VALUES = {
    model: vehicle ? (CUSTOM_TEXTFIELD_VALUES ? vehicle.model.value.value : vehicle.modelId) : "",
    modelName: vehicle?.model.value.value ?? "",
    modelValue: vehicle?.model ?? null,
    trimLevels: vehicle?.trimLevels?.map((v) => ({ label: v.value, value: v.id })) ?? [],

    color: vehicle?.color ?? "",
    insuranceStatus: vehicle?.insuranceStatusId ?? null,
    inspectionStatus: vehicle?.inspectionStatus ?? null,
    taxStatus: vehicle?.taxStatus ?? null,
    registrationStatus: vehicle?.registrationStatusId ?? "",
    citizenId: isDisabled ? citizen.id : vehicle?.citizenId ?? "",
    name: isDisabled
      ? `${citizen.name} ${citizen.surname}`
      : vehicle?.citizen
      ? `${vehicle.citizen.name} ${vehicle.citizen.surname}`
      : "",
    plate: vehicle?.plate ?? "",
    vinNumber: vehicle?.vinNumber ?? "",
    reportedStolen: vehicle?.reportedStolen ?? false,
    reApplyForDmv: vehicle?.dmvStatus === WhitelistStatus.DECLINED ? false : undefined,
    businessId: currentBusiness?.id ?? null,
    employeeId: currentEmployee?.id ?? null,
  };

  return (
    <Modal
      title={t("registerVehicle")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.RegisterVehicle)}
      className="w-[700px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, setValues, errors, values, isValid }) => (
          <Form>
            <TextField
              errorMessage={errors.plate}
              label={tVehicle("plate")}
              onChange={(value) => setFieldValue("plate", value.toUpperCase())}
              name="plate"
              value={values.plate.toUpperCase()}
              maxLength={maxPlateLength}
            />

            {CUSTOM_TEXTFIELD_VALUES ? (
              <FormField errorMessage={errors.model} label={tVehicle("model")}>
                <Input
                  list="vehicle-models-list"
                  value={values.model}
                  name="model"
                  onChange={(e) => {
                    const value = e.target.value;
                    setValues({
                      ...values,
                      modelName: value,
                      model: value,
                    });
                  }}
                />

                <datalist id="vehicle-models-list">
                  {vehicles.values.map((vehicle) => (
                    <span key={vehicle.id}>{vehicle.value.value}</span>
                  ))}
                </datalist>
              </FormField>
            ) : (
              <AsyncListSearchField<VehicleValue>
                localValue={values.modelName}
                setValues={({ localValue, node }) => {
                  const modelName =
                    typeof localValue !== "undefined" ? { modelName: localValue } : {};
                  const model = node ? { model: node.key as string, modelValue: node.value } : {};

                  setValues({ ...values, ...modelName, ...model });
                }}
                errorMessage={errors.model}
                label={tVehicle("model")}
                selectedKey={values.model}
                fetchOptions={{
                  apiPath: (value) => `/admin/values/vehicle/search?query=${value}`,
                  method: "GET",
                }}
              >
                {(item) => {
                  return <Item textValue={item.value.value}>{item.value.value}</Item>;
                }}
              </AsyncListSearchField>
            )}

            <CitizenSuggestionsField
              isOptional={isLeo}
              allowsCustomValue
              label={tVehicle("owner")}
              fromAuthUserOnly={!isLeo}
              labelFieldName="name"
              valueFieldName="citizenId"
              isDisabled={isDisabled}
            />

            <TextField
              errorMessage={errors.color}
              label={tVehicle("color")}
              onChange={(value) => setFieldValue("color", value)}
              name="color"
              value={values.color}
            />

            <FormField label={tVehicle("trimLevels")}>
              <Select
                name="trimLevels"
                value={values.trimLevels}
                isMulti
                closeMenuOnSelect={false}
                onChange={handleChange}
                values={
                  values.modelValue?.trimLevels?.map((value) => ({
                    label: value.value,
                    value: value.id,
                  })) ?? []
                }
              />
            </FormField>

            <TextField
              errorMessage={errors.vinNumber}
              label={tVehicle("vinNumber")}
              onChange={(value) => setFieldValue("vinNumber", value.toUpperCase())}
              name="vinNumber"
              value={values.vinNumber.toUpperCase()}
              isOptional
              isDisabled={!EDITABLE_VIN}
              placeholder={EDITABLE_VIN ? undefined : common("autoGenerated")}
            />

            <FormRow>
              <ValueSelectField
                fieldName="registrationStatus"
                valueType={ValueType.LICENSE}
                values={filterLicenseTypes(license.values, ValueLicenseType.REGISTRATION_STATUS)}
                label={tVehicle("registrationStatus")}
                filterFn={(v) => filterLicenseType(v, ValueLicenseType.REGISTRATION_STATUS)}
              />

              <ValueSelectField
                fieldName="insuranceStatus"
                valueType={ValueType.LICENSE}
                values={filterLicenseTypes(license.values, ValueLicenseType.INSURANCE_STATUS)}
                label={tVehicle("insuranceStatus")}
                filterFn={(v) => filterLicenseType(v, ValueLicenseType.INSURANCE_STATUS)}
              />
            </FormRow>

            <FormRow>
              <SelectField
                isOptional
                errorMessage={errors.inspectionStatus}
                label={tVehicle("inspectionStatus")}
                name="inspectionStatus"
                options={INSPECTION_STATUS}
                onSelectionChange={(key) => setFieldValue("inspectionStatus", key)}
                selectedKey={values.inspectionStatus}
                isClearable
              />

              <SelectField
                isOptional
                errorMessage={errors.taxStatus}
                label={tVehicle("taxStatus")}
                name="taxStatus"
                options={TAX_STATUS}
                onSelectionChange={(key) => setFieldValue("taxStatus", key)}
                isClearable
                selectedKey={values.taxStatus}
              />
            </FormRow>

            {vehicle ? (
              <FormRow>
                <FormField errorMessage={errors.reportedStolen} label={tVehicle("reportAsStolen")}>
                  <Toggle
                    onCheckedChange={handleChange}
                    name="reportedStolen"
                    value={values.reportedStolen}
                  />
                </FormField>

                <FormField errorMessage={errors.reApplyForDmv} label={tVehicle("reApplyForDmv")}>
                  <Toggle
                    disabled={vehicle.dmvStatus !== WhitelistStatus.DECLINED}
                    onCheckedChange={handleChange}
                    name="reApplyForDmv"
                    value={values.reApplyForDmv ?? false}
                  />
                </FormField>
              </FormRow>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {vehicle ? common("save") : t("registerVehicle")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
