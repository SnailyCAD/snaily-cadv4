import * as React from "react";
import {
  DEPARTMENT_SCHEMA,
  DIVISION_SCHEMA,
  HASH_SCHEMA,
  CODES_10_SCHEMA,
  BUSINESS_ROLE_SCHEMA,
  BASE_VALUE_SCHEMA,
  CALL_TYPE_SCHEMA,
} from "@snailycad/schemas";
import { Loader, Button, SelectField, TextField, SwitchField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import {
  type AnyValue,
  DriversLicenseCategoryType,
  EmployeeAsEnum,
  type Feature,
  QualificationValueType,
  ValueType,
} from "@snailycad/types";
import { useTranslations } from "use-intl";
import hexColor from "hex-color-regex";
import { ModalIds } from "types/modal-ids";
import { DepartmentFields } from "./manage-modal/department-fields";
import { StatusValueFields, useDefaultDepartments } from "./manage-modal/status-value-fields";
import { LicenseFields } from "./manage-modal/license-fields";
import {
  isEmployeeValue,
  isBaseValue,
  isDepartmentValue,
  isDivisionValue,
  isStatusValue,
  isVehicleValue,
  isWeaponValue,
  isUnitQualification,
  isDLCategoryValue,
  isCallTypeValue,
  isOfficerRankValue,
  isAddressValue,
  isEmergencyVehicleValue,
} from "@snailycad/utils/typeguards";
import { QualificationFields } from "./manage-modal/qualification-fields";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import type { PatchValueByIdData, PostValuesData } from "@snailycad/types/api";
import {
  getDisabledFromValue,
  getTypeForValue,
  getValueStrFromValue,
  makeDefaultWhatPages,
} from "lib/admin/values/utils";
import { DivisionFields } from "./manage-modal/division-fields";
import { AddressFields } from "./manage-modal/address-fields";
import {
  EmergencyVehicleFields,
  useDefaultDivisions,
} from "./manage-modal/emergency-vehicle-fields";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { VehicleFields } from "./manage-modal/vehicle-fields";
import type { z } from "zod";

interface Props {
  type: ValueType;
  value: AnyValue | null;
  onCreate(newValue: AnyValue): void;
  onUpdate(oldValue: AnyValue, newValue: AnyValue): void;
}

const EXTRA_SCHEMAS: Partial<Record<ValueType, z.ZodType>> = {
  CODES_10: CODES_10_SCHEMA,
  DEPARTMENT: DEPARTMENT_SCHEMA,
  DIVISION: DIVISION_SCHEMA,
  VEHICLE: HASH_SCHEMA,
  WEAPON: HASH_SCHEMA,
  BUSINESS_ROLE: BUSINESS_ROLE_SCHEMA,
  CALL_TYPE: CALL_TYPE_SCHEMA,
};

interface CreateInitialValuesOptions {
  value: AnyValue | null;
  type: ValueType;
  features: Record<Feature, boolean>;
  makeDefaultDepartmentsValues(value: AnyValue): string[];
  defaultDivisions(value: AnyValue): string[];
}

export type ManageValueFormValues = ReturnType<typeof createInitialValues>;
function createInitialValues(options: CreateInitialValuesOptions) {
  const { value } = options;

  return {
    isDisabled: value ? getDisabledFromValue(value) : false,
    value: value ? getValueStrFromValue(value) : "",

    description:
      value &&
      (isUnitQualification(value) || isDLCategoryValue(value) || isEmergencyVehicleValue(value))
        ? (value.description ?? "")
        : "",
    qualificationType:
      value && isUnitQualification(value)
        ? value.qualificationType
        : QualificationValueType.QUALIFICATION,

    shouldDo: value && isStatusValue(value) ? value.shouldDo : "",
    color: value && isStatusValue(value) ? (value.color ?? "") : "",
    textColor: value && isStatusValue(value) ? (value.textColor ?? "") : "",
    type: getTypeForValue(options.type, value),
    departments:
      value &&
      (isStatusValue(value) || isUnitQualification(value) || isEmergencyVehicleValue(value))
        ? options.makeDefaultDepartmentsValues(value)
        : undefined,
    whatPages: value && isStatusValue(value) ? makeDefaultWhatPages(value) : [],

    pairedUnitTemplate: value && isDivisionValue(value) ? (value.pairedUnitTemplate ?? "") : "",
    departmentId: value && isDivisionValue(value) ? value.departmentId : "",
    isConfidential: value && isDepartmentValue(value) ? value.isConfidential : false,
    whitelisted: value && isDepartmentValue(value) ? value.whitelisted : false,
    defaultOfficerRankId: value && isDepartmentValue(value) ? value.defaultOfficerRankId : null,
    isDefaultDepartment: value && isDepartmentValue(value) ? value.isDefaultDepartment : false,
    callsign:
      value && (isDepartmentValue(value) || isDivisionValue(value)) ? (value.callsign ?? "") : "",
    customTemplate: value && isDepartmentValue(value) ? (value.customTemplate ?? "") : "",

    as: value && isEmployeeValue(value) ? value.as : "",
    hash: value && (isVehicleValue(value) || isWeaponValue(value)) ? (value.hash ?? "") : undefined,
    trimLevels: value && isVehicleValue(value) ? (value.trimLevels?.map((v) => v.id) ?? []) : [],

    licenseType: value && isBaseValue(value) ? value.licenseType : null,
    isDefault: value && isBaseValue(value) ? value.isDefault : undefined,
    priority: value && isCallTypeValue(value) ? (value.priority ?? undefined) : undefined,
    isDisposition: value && isCallTypeValue(value) ? (value.isDisposition ?? undefined) : undefined,

    officerRankImageId: "",
    officerRankDepartments:
      value && isOfficerRankValue(value) ? options.makeDefaultDepartmentsValues(value) : undefined,

    postal: value && isAddressValue(value) ? (value.postal ?? "") : "",
    county: value && isAddressValue(value) ? (value.county ?? "") : "",

    divisions:
      value && isEmergencyVehicleValue(value) && options.features.DIVISIONS
        ? options.defaultDivisions(value)
        : undefined,

    showPicker: false,
    image: "",

    extraFields:
      value &&
      (isDivisionValue(value) || isDepartmentValue(value) || isEmergencyVehicleValue(value))
        ? safelyStringifyJSON(value.extraFields)
        : "null",

    departmentLinks: value && isDepartmentValue(value) ? (value.links ?? []) : [],
  };
}

export function ManageValueModal({ onCreate, onUpdate, type, value }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);

  const { state, execute } = useFetch();
  const modalState = useModal();
  const t = useTranslations(type);
  const common = useTranslations("Common");
  const tValues = useTranslations("Values");
  const { makeDefaultDepartmentsValues } = useDefaultDepartments();
  const defaultDivisions = useDefaultDivisions();

  const title = !value ? t("ADD") : t("EDIT");
  const footerTitle = !value ? t("ADD") : common("save");
  const { department } = useValues();
  const features = useFeatureEnabled();

  const BUSINESS_VALUES = [
    {
      value: EmployeeAsEnum.OWNER,
      label: tValues("owner"),
    },
    {
      value: EmployeeAsEnum.MANAGER,
      label: tValues("manager"),
    },
    {
      value: EmployeeAsEnum.EMPLOYEE,
      label: tValues("employee"),
    },
  ];

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (safelyParseJSON(values.extraFields) === false) {
      helpers.setFieldError("extraFields", tValues("mustBeValidJson"));
      return;
    }

    const data = {
      ...values,
      whatPages: values.whatPages,
      departments: values.departments,
      divisions: values.divisions,
      officerRankDepartments: values.officerRankDepartments,
      trimLevels: values.trimLevels,
      extraFields: safelyParseJSON(values.extraFields),
    };

    if (value) {
      const { json } = await execute<PatchValueByIdData, typeof INITIAL_VALUES>({
        path: `/admin/values/${type.toLowerCase()}/${value.id}`,
        method: "PATCH",
        data,
        helpers,
      });

      if (json?.id) {
        modalState.closeModal(ModalIds.ManageValue);
        await handleValueImageUpload(type.toLowerCase(), value.id, helpers);
        onUpdate(value, json);
      }
    } else {
      const { json } = await execute<PostValuesData, typeof INITIAL_VALUES>({
        path: `/admin/values/${type.toLowerCase()}`,
        method: "POST",
        data,
        helpers,
      });

      if (json?.id) {
        await handleValueImageUpload(type.toLowerCase(), json.id, helpers);
        modalState.closeModal(ModalIds.ManageValue);
        onCreate(json);
      }
    }
  }

  async function handleValueImageUpload(
    type: string,
    id: string,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = new FormData();
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage !== "string") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    if (validatedImage && typeof validatedImage === "object") {
      await execute({
        path: `/admin/values/${type}/image/${id}`,
        method: "POST",
        data: fd,
        helpers,
        headers: {
          "content-type": "multipart/form-data",
        },
      });
    }
  }

  const INITIAL_VALUES = createInitialValues({
    value,
    type,
    makeDefaultDepartmentsValues,
    defaultDivisions,
    features,
  });

  function validate(values: typeof INITIAL_VALUES) {
    if (type === ValueType.LICENSE) {
      // temporary fix, it seems to not update the schema :thinking:
      return {};
    }

    const schemaToUse = EXTRA_SCHEMAS[type] ?? BASE_VALUE_SCHEMA;
    const errors = handleValidate(schemaToUse)(values);

    if (values.color && !hexColor().test(values.color)) {
      return {
        ...errors,
        color: tValues("mustBeValidHexColor"),
      };
    }

    if (values.textColor && !hexColor().test(values.textColor)) {
      return {
        ...errors,
        textColor: tValues("mustBeValidHexColor"),
      };
    }

    return errors;
  }

  return (
    <Modal
      className="w-[600px]"
      title={title}
      onClose={() => modalState.closeModal(ModalIds.ManageValue)}
      isOpen={modalState.isOpen(ModalIds.ManageValue)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors }) => (
          <Form>
            {type === ValueType.DIVISION ? null : (
              <TextField
                errorMessage={errors.value}
                label={tValues("value")}
                autoFocus
                name="value"
                onChange={(value) => setFieldValue("value", value)}
                value={values.value}
              />
            )}

            {type === ValueType.EMERGENCY_VEHICLE ? <EmergencyVehicleFields /> : null}
            {type === ValueType.LICENSE ? <LicenseFields /> : null}

            {type === ValueType.DIVISION ? <DivisionFields /> : null}
            {type === ValueType.DEPARTMENT ? <DepartmentFields /> : null}
            {type === ValueType.QUALIFICATION ? (
              <QualificationFields image={image} setImage={setImage} />
            ) : null}

            {type === ValueType.ADDRESS ? <AddressFields /> : null}

            {type === ValueType.BUSINESS_ROLE ? (
              <SelectField
                errorMessage={errors.as}
                label={tValues("as")}
                options={BUSINESS_VALUES}
                name="as"
                onSelectionChange={(key) => setFieldValue("as", key)}
                selectedKey={values.as}
              />
            ) : null}

            {type === ValueType.DRIVERSLICENSE_CATEGORY ? (
              <SelectField
                errorMessage={errors.type}
                label={tValues("category")}
                options={Object.keys(DriversLicenseCategoryType).map((key) => ({
                  value: key,
                  label: key,
                }))}
                onSelectionChange={(value) => setFieldValue("type", value)}
                selectedKey={values.type}
              />
            ) : null}

            {["VEHICLE", "WEAPON"].includes(type) ? (
              <TextField
                isOptional
                errorMessage={errors.hash}
                label={tValues("gameHash")}
                name="hash"
                onChange={(value) => setFieldValue("hash", value)}
                value={values.hash}
              />
            ) : null}

            {type === ValueType.VEHICLE ? (
              <VehicleFields setImage={setImage} image={image} />
            ) : null}

            {type === ValueType.CALL_TYPE ? (
              <TextField
                type="number"
                isOptional
                errorMessage={errors.priority}
                label={tValues("priority")}
                name="priority"
                onChange={(value) => setFieldValue("priority", value)}
                value={values.priority}
              />
            ) : null}

            {type === ValueType.CALL_TYPE ? (
              <SwitchField
                name="isDisposition"
                onChange={(value) => setFieldValue("isDisposition", value)}
                isSelected={values.isDisposition}
                description={tValues("isDispositionDescription")}
              >
                {tValues("isDisposition")}
              </SwitchField>
            ) : null}

            {type === ValueType.OFFICER_RANK ? (
              <>
                <ImageSelectInput valueKey="officerRankImageId" image={image} setImage={setImage} />

                <SelectField
                  isOptional
                  label={tValues("departments")}
                  isClearable
                  selectionMode="multiple"
                  errorMessage={errors.officerRankDepartments}
                  options={department.values.map((department) => ({
                    value: department.id,
                    label: department.value.value,
                  }))}
                  selectedKeys={values.officerRankDepartments}
                  onSelectionChange={(keys) => setFieldValue("officerRankDepartments", keys)}
                />
              </>
            ) : null}

            {type === ValueType.DRIVERSLICENSE_CATEGORY ? (
              <TextField
                isTextarea
                isOptional
                errorMessage={errors.description}
                label={common("description")}
                name="description"
                onChange={(value) => setFieldValue("description", value)}
                value={values.description}
              />
            ) : null}

            {type === "CODES_10" ? <StatusValueFields /> : null}

            <SwitchField
              className="my-4 mt-8"
              isSelected={values.isDisabled}
              onChange={(isSelected) => setFieldValue("isDisabled", isSelected)}
              description={tValues("disabledDescription")}
            >
              {tValues("isDisabled")}
            </SwitchField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.ManageValue)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {footerTitle}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

function safelyParseJSON(json: string) {
  if (!json) return null;

  try {
    return JSON.parse(json);
  } catch {
    return false;
  }
}

function safelyStringifyJSON(json: string | null) {
  if (!json) return "null";

  try {
    return JSON.stringify(json, null, 4);
  } catch {
    return "null";
  }
}
