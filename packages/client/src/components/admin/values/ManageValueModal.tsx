import * as React from "react";
import {
  DEPARTMENT_SCHEMA,
  DIVISION_SCHEMA,
  HASH_SCHEMA,
  CODES_10_SCHEMA,
  BUSINESS_ROLE_SCHEMA,
  BASE_VALUE_SCHEMA,
} from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { DriversLicenseCategoryType, EmployeeAsEnum, ValueType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";
import hexColor from "hex-color-regex";
import { getValueStrFromValue } from "src/pages/admin/values/[path]";
import { ModalIds } from "types/ModalIds";
import { makeDefaultWhatPages } from "lib/admin/values";
import { DepartmentFields } from "./manage-modal/DepartmentFields";
import {
  StatusValueFields,
  useDefaultDepartments,
  WHAT_PAGES_LABELS,
} from "./manage-modal/StatusValueFields";
import { LicenseFields } from "./manage-modal/LicenseFields";
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
  AnyValue,
} from "@snailycad/utils/typeguards";
import { QualificationFields } from "./manage-modal/QualificationFields";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { Textarea } from "components/form/Textarea";

interface Props {
  type: ValueType;
  value: AnyValue | null;
  clType?: DriversLicenseCategoryType | null;
  onCreate(newValue: AnyValue): void;
  onUpdate(oldValue: AnyValue, newValue: AnyValue): void;
}

const BUSINESS_VALUES = [
  {
    value: EmployeeAsEnum.OWNER,
    label: "Owner",
  },
  {
    value: EmployeeAsEnum.MANAGER,
    label: "Manager",
  },
  {
    value: EmployeeAsEnum.EMPLOYEE,
    label: "Employee",
  },
];

const EXTRA_SCHEMAS: Partial<Record<ValueType, any>> = {
  CODES_10: CODES_10_SCHEMA,
  DEPARTMENT: DEPARTMENT_SCHEMA,
  DIVISION: DIVISION_SCHEMA,
  VEHICLE: HASH_SCHEMA,
  WEAPON: HASH_SCHEMA,
  BUSINESS_ROLE: BUSINESS_ROLE_SCHEMA,
};

export function ManageValueModal({ onCreate, onUpdate, clType: dlType, type, value }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);

  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations(type);
  const common = useTranslations("Common");
  const defaultDepartments = useDefaultDepartments();

  const title = !value ? t("ADD") : t("EDIT");
  const footerTitle = !value ? t("ADD") : common("save");
  const { department } = useValues();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const data = {
      ...values,
      type: dlType ? dlType : values.type,
      whatPages: values.whatPages?.map((v: any) => v.value),
      departments: values.departments?.map((v: any) => v.value),
    };

    if (value) {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${value.id}`, {
        method: "PATCH",
        data,
        helpers,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageValue);
        await handleValueImageUpload(type.toLowerCase(), value.id, helpers);
        onUpdate(value, json);
      }
    } else {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}`, {
        method: "POST",
        data,
        helpers,
      });

      if (json?.id) {
        await handleValueImageUpload(type.toLowerCase(), json.id, helpers);
        closeModal(ModalIds.ManageValue);
        onCreate(json);
      }
    }
  }

  async function handleValueImageUpload(type: string, id: string, helpers: FormikHelpers<any>) {
    const fd = new FormData();
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage === "object") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    if (validatedImage && typeof validatedImage === "object") {
      await execute(`/admin/values/${type}/image/${id}`, {
        method: "POST",
        data: fd,
        helpers,
      });
    }
  }

  const INITIAL_VALUES = {
    value: value ? getValueStrFromValue(value) : "",

    description:
      value && (isUnitQualification(value) || isDLCategoryValue(value))
        ? value.description ?? ""
        : "",
    qualificationType:
      value && isUnitQualification(value) ? value.qualificationType : "qualification",

    shouldDo: value && isStatusValue(value) ? value.shouldDo : "",
    color: value && isStatusValue(value) ? value.color ?? "" : "",
    type: value && (isStatusValue(value) || isDepartmentValue(value)) ? value.type : "STATUS_CODE",
    departments:
      value && (isStatusValue(value) || isUnitQualification(value))
        ? defaultDepartments(value)
        : undefined,
    whatPages:
      value && isStatusValue(value)
        ? makeDefaultWhatPages(value)?.map((v) => ({
            label: WHAT_PAGES_LABELS[v],
            value: v,
          }))
        : [],

    pairedUnitTemplate: value && isDivisionValue(value) ? value.pairedUnitTemplate ?? "" : "",
    departmentId: value && isDivisionValue(value) ? value.departmentId : "",
    isConfidential: value && isDepartmentValue(value) ? value.isConfidential : false,
    whitelisted: value && isDepartmentValue(value) ? value.whitelisted : false,
    defaultOfficerRankId: value && isDepartmentValue(value) ? value.defaultOfficerRankId : null,
    isDefaultDepartment: value && isDepartmentValue(value) ? value.isDefaultDepartment : false,
    callsign:
      value && (isDepartmentValue(value) || isDivisionValue(value)) ? value.callsign ?? "" : "",

    as: value && isEmployeeValue(value) ? value.as : "",
    hash: value && (isVehicleValue(value) || isWeaponValue(value)) ? value.hash ?? "" : undefined,

    licenseType: value && isBaseValue(value) ? value.licenseType : null,
    isDefault: value && isBaseValue(value) ? value.isDefault : undefined,
    officerRankImageId: "",

    showPicker: false,
    image: "",
  };

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
        color: "Must be a valid HEX color",
      };
    }

    return errors;
  }

  return (
    <Modal
      className="w-[600px]"
      title={title}
      onClose={() => closeModal(ModalIds.ManageValue)}
      isOpen={isOpen(ModalIds.ManageValue)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
            {type === "DIVISION" ? (
              <FormField label="Department">
                <Select
                  values={department.values.map((v) => ({
                    value: v.id,
                    label: v.value.value,
                  }))}
                  name="departmentId"
                  onChange={handleChange}
                  value={values.departmentId}
                />
              </FormField>
            ) : null}

            <FormField errorMessage={errors.value} label="Value">
              <Input autoFocus name="value" onChange={handleChange} value={values.value} />
            </FormField>

            {type === "LICENSE" ? <LicenseFields /> : null}

            {["DIVISION"].includes(type) ? (
              <>
                <FormField optional label="Callsign Symbol">
                  <Input name="callsign" onChange={handleChange} value={values.callsign} />
                </FormField>

                <FormField optional label="Paired Unit Template">
                  <Input
                    name="pairedUnitTemplate"
                    onChange={handleChange}
                    value={values.pairedUnitTemplate}
                  />
                </FormField>
              </>
            ) : null}

            {type === ValueType.DEPARTMENT ? <DepartmentFields /> : null}
            {type === ValueType.QUALIFICATION ? (
              <QualificationFields image={image} setImage={setImage} />
            ) : null}

            {type === ValueType.BUSINESS_ROLE ? (
              <FormField label="As (this is so the database knows what to use.)">
                <Select
                  values={BUSINESS_VALUES}
                  name="as"
                  onChange={handleChange}
                  value={values.as}
                />
              </FormField>
            ) : null}

            {["VEHICLE", "WEAPON"].includes(type) ? (
              <FormField optional label="Game Hash">
                <Input name="hash" onChange={handleChange} value={values.hash} />
              </FormField>
            ) : null}

            {type === ValueType.OFFICER_RANK ? (
              <>
                <ImageSelectInput valueKey="officerRankImageId" image={image} setImage={setImage} />

                <FormField optional label="Departments">
                  <Select
                    name="departments"
                    onChange={handleChange}
                    value={values.departments ?? []}
                    values={department.values.map((department) => ({
                      value: department.id,
                      label: department.value.value,
                    }))}
                  />
                </FormField>
              </>
            ) : null}

            {type === ValueType.DRIVERSLICENSE_CATEGORY ? (
              <FormField optional label="Description">
                <Textarea name="description" onChange={handleChange} value={values.description} />
              </FormField>
            ) : null}

            {type === "CODES_10" ? <StatusValueFields /> : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageValue)}
                variant="cancel"
              >
                Cancel
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
