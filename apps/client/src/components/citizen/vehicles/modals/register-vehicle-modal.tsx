import * as React from "react";
import { useTranslations } from "use-intl";
import { Form, Formik, type FormikHelpers } from "formik";
import { LEO_VEHICLE_SCHEMA, VEHICLE_SCHEMA } from "@snailycad/schemas";
import {
  Item,
  AsyncListSearchField,
  Button,
  Loader,
  SelectField,
  TextField,
  SwitchField,
  FormRow,
} from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useValues } from "src/context/ValuesContext";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import {
  type RegisteredVehicle,
  ValueLicenseType,
  ValueType,
  type VehicleValue,
  WhitelistStatus,
} from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { useRouter } from "next/router";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useBusinessState } from "state/business-state";
import { filterLicenseType, filterLicenseTypes } from "lib/utils";
import { useVehicleLicenses } from "hooks/locale/useVehicleLicenses";
import { toastMessage } from "lib/toastMessage";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type {
  PostCitizenImageByIdData,
  PostCitizenVehicleData,
  PutCitizenVehicleData,
} from "@snailycad/types/api";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";

interface Props {
  vehicle: RegisteredVehicle | null;
  onCreate?(newV: RegisteredVehicle): void;
  onUpdate?(old: RegisteredVehicle, newV: RegisteredVehicle): void;
  onClose?(): void;
}

export function RegisterVehicleModal({ vehicle, onClose, onCreate, onUpdate }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);

  const { state, execute } = useFetch();
  const modalState = useModal();
  const t = useTranslations("Citizen");
  const tVehicle = useTranslations("Vehicles");
  const common = useTranslations("Common");
  const { citizen } = useCitizen(false);
  const router = useRouter();
  const { cad } = useAuth();
  const { CUSTOM_TEXTFIELD_VALUES, EDITABLE_VIN } = useFeatureEnabled();
  const { currentBusiness, currentEmployee } = useBusinessState((state) => ({
    currentBusiness: state.currentBusiness,
    currentEmployee: state.currentEmployee,
  }));

  const { INSPECTION_STATUS, TAX_STATUS } = useVehicleLicenses();

  const { license } = useValues();

  const isDisabled = router.pathname === "/citizen/[id]";
  const maxPlateLength = cad?.miscCadSettings?.maxPlateLength ?? 8;
  const isLeo = router.pathname.includes("/officer");

  const schema = isLeo ? LEO_VEHICLE_SCHEMA : VEHICLE_SCHEMA;
  const validate = handleValidate(schema);

  function handleClose() {
    modalState.closeModal(ModalIds.RegisterVehicle);
    onClose?.();
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const data = {
      ...values,
      modelValue: undefined,
    };

    if (vehicle && !isLeo) {
      const { json } = await execute<PutCitizenVehicleData, typeof INITIAL_VALUES>({
        path: `/vehicles/${vehicle.id}`,
        method: "PUT",
        data,
        helpers,
      });

      if (json?.id) {
        const imageId = await handleImageUpload(json.id, helpers);

        onUpdate?.(vehicle, { ...vehicle, ...json, imageId });
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
        const imageId = await handleImageUpload(json.id, helpers);

        toastMessage({
          title: common("success"),
          message: tVehicle("successVehicleRegistered", { plate: values.plate.toUpperCase() }),
          icon: "success",
        });
        onCreate?.({ ...json, imageId });
      }
    }
  }

  async function handleImageUpload(id: string, helpers: FormikHelpers<typeof INITIAL_VALUES>) {
    const fd = new FormData();
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage !== "string") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    if (validatedImage && typeof validatedImage === "object") {
      const { json } = await execute<PostCitizenImageByIdData>({
        path: `/vehicles/${id}`,
        method: "POST",
        data: fd,

        headers: {
          "content-type": "multipart/form-data",
        },
      });

      return json.imageId;
    }

    return null;
  }

  const INITIAL_VALUES = {
    model: vehicle ? (CUSTOM_TEXTFIELD_VALUES ? vehicle.model.value.value : vehicle.modelId) : "",
    modelName: vehicle?.model.value.value ?? "",
    modelValue: vehicle?.model ?? null,
    trimLevels: (vehicle?.trimLevels ?? []).map((v) => v.id),

    color: vehicle?.color ?? "",
    insuranceStatus: vehicle?.insuranceStatusId ?? null,
    inspectionStatus: vehicle?.inspectionStatus ?? null,
    taxStatus: vehicle?.taxStatus ?? null,
    registrationStatus: vehicle?.registrationStatusId ?? "",
    citizenId: isDisabled ? citizen.id : (vehicle?.citizenId ?? ""),
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
      isOpen={modalState.isOpen(ModalIds.RegisterVehicle)}
      className="w-[700px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, setValues, errors, values, isValid }) => (
          <Form>
            <ImageSelectInput image={image} setImage={setImage} isOptional />

            <TextField
              errorMessage={errors.plate}
              label={tVehicle("plate")}
              onChange={(value) => setFieldValue("plate", value.toUpperCase())}
              name="plate"
              value={values.plate.toUpperCase()}
              maxLength={maxPlateLength}
            />

            <AsyncListSearchField<VehicleValue>
              allowsCustomValue={CUSTOM_TEXTFIELD_VALUES}
              localValue={values.modelName}
              onInputChange={(value) => {
                setFieldValue("modelName", value);
                if (CUSTOM_TEXTFIELD_VALUES && value) {
                  setFieldValue("model", value);
                }
              }}
              onSelectionChange={(node) => {
                if (CUSTOM_TEXTFIELD_VALUES && node) {
                  setValues({
                    ...values,
                    modelValue: node.value,
                    modelName: node.textValue,
                    model: node.textValue,
                  });
                  return;
                }

                if (node) {
                  setValues({
                    ...values,
                    modelValue: node.value,
                    modelName: node.value?.value.value ?? node.textValue,
                    model: node.key as string,
                  });
                }
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

            <SelectField
              isOptional
              label={tVehicle("trimLevels")}
              selectionMode="multiple"
              selectedKeys={values.trimLevels}
              onSelectionChange={(keys) => setFieldValue("trimLevels", keys)}
              options={(values.modelValue?.trimLevels ?? []).map((value) => ({
                label: value.value,
                value: value.id,
              }))}
            />

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
                <SwitchField
                  isSelected={values.reportedStolen}
                  onChange={(isSelected) => setFieldValue("reportedStolen", isSelected)}
                >
                  {tVehicle("reportAsStolen")}
                </SwitchField>

                <SwitchField
                  isSelected={values.reApplyForDmv}
                  onChange={(isSelected) => setFieldValue("reApplyForDmv", isSelected)}
                  isDisabled={vehicle.dmvStatus !== WhitelistStatus.DECLINED}
                >
                  {tVehicle("reApplyForDmv")}
                </SwitchField>
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
