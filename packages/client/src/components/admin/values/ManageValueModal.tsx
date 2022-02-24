import {
  DEPARTMENT_SCHEMA,
  DIVISION_SCHEMA,
  HASH_SCHEMA,
  CODES_10_SCHEMA,
  BUSINESS_ROLE_SCHEMA,
  VALUE_SCHEMA,
} from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import {
  DriversLicenseCategoryType,
  EmployeeAsEnum,
  ValueLicenseType,
  ValueType,
} from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";
import hexColor from "hex-color-regex";
import { type TValue, getValueStrFromValue } from "src/pages/admin/values/[path]";
import { ModalIds } from "types/ModalIds";
import { makeDefaultWhatPages } from "lib/admin/values";
import { DepartmentFields } from "./manage-modal/DepartmentFields";
import {
  StatusValueFields,
  useDefaultDepartments,
  WHAT_PAGES_LABELS,
} from "./manage-modal/StatusValueFields";

interface Props {
  type: ValueType;
  value: TValue | null;
  clType?: DriversLicenseCategoryType | null;
  onCreate: (newValue: TValue) => void;
  onUpdate: (oldValue: TValue, newValue: TValue) => void;
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

export const LICENSE_LABELS = {
  [ValueLicenseType.LICENSE]: "License",
  [ValueLicenseType.REGISTRATION_STATUS]: "Registration Status",
};

const LICENSE_TYPES = Object.values(ValueLicenseType).map((v) => ({
  label: LICENSE_LABELS[v] as string,
  value: v,
}));

const EXTRA_SCHEMAS: Partial<Record<ValueType, any>> = {
  CODES_10: CODES_10_SCHEMA,
  DEPARTMENT: DEPARTMENT_SCHEMA,
  DIVISION: DIVISION_SCHEMA,
  VEHICLE: HASH_SCHEMA,
  WEAPON: HASH_SCHEMA,
  BUSINESS_ROLE: BUSINESS_ROLE_SCHEMA,
};

export function ManageValueModal({ onCreate, onUpdate, clType: dlType, type, value }: Props) {
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
      whatPages: values.whatPages.map((v: any) => v.value),
    };

    if (value) {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${value.id}`, {
        method: "PATCH",
        data,
        helpers,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageValue);
        onUpdate(value, json);
      }
    } else {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}`, {
        method: "POST",
        data,
        helpers,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageValue);
        onCreate(json);
      }
    }
  }

  const INITIAL_VALUES = {
    value: value ? getValueStrFromValue(value) : "",
    as: typeof value?.value === "string" ? "" : value && "as" in value ? value.as : "",
    shouldDo:
      typeof value?.value === "string" ? "" : value && "shouldDo" in value ? value.shouldDo : "",
    departmentId:
      typeof value?.value === "string"
        ? ""
        : value && "departmentId" in value
        ? value.departmentId
        : "",
    // @ts-expect-error shortcut
    callsign: value?.callsign ?? "",
    // @ts-expect-error shortcut
    color: value?.color ?? "",
    // @ts-expect-error shortcut
    type: value?.type ?? "STATUS_CODE",
    // @ts-expect-error shortcut
    hash: value?.hash ?? "",
    // @ts-expect-error shortcut
    licenseType: value?.licenseType ?? null,
    // @ts-expect-error shortcut
    whitelisted: value?.whitelisted ?? false,
    // @ts-expect-error shortcut
    isDefaultDepartment: value?.isDefaultDepartment ?? false,
    // @ts-expect-error shortcut
    whatPages: makeDefaultWhatPages(value).map((v) => ({
      label: WHAT_PAGES_LABELS[v],
      value: v,
    })),
    showPicker: false,
    // @ts-expect-error shortcut
    departments: defaultDepartments(value),
  };

  function validate(values: typeof INITIAL_VALUES) {
    const schemaToUse = EXTRA_SCHEMAS[type] ?? VALUE_SCHEMA;
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
        {({ handleSubmit, handleChange, values, errors }) => (
          <form onSubmit={handleSubmit}>
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

            {type === "LICENSE" ? (
              <FormField errorMessage={errors.licenseType as string} label="Type">
                <Select
                  isClearable
                  name="licenseType"
                  onChange={handleChange}
                  value={values.licenseType}
                  values={LICENSE_TYPES}
                />

                <ul className="mt-5">
                  <li className="my-1.5 text-base italic">
                    - <b>None:</b>{" "}
                    {
                      /* eslint-disable-next-line quotes */
                      'Type is both a "License" and "Registration Status". Both can be used anywhere.'
                    }
                  </li>
                  <li className="my-1.5 text-base italic">
                    - <b>License:</b> can only be used as a license when setting a citizen drivers
                    license, firearms license, etc
                  </li>
                  <li className="my-1.5 text-base italic">
                    - <b>Registration Status:</b> can only be used when setting a registration
                    status on a vehicle or weapon.
                  </li>
                </ul>
              </FormField>
            ) : null}

            {["DIVISION"].includes(type) ? (
              <FormField optional label="Callsign Symbol">
                <Input name="callsign" onChange={handleChange} value={values.callsign} />
              </FormField>
            ) : null}

            {type === "DEPARTMENT" ? <DepartmentFields /> : null}

            {type === "BUSINESS_ROLE" ? (
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
          </form>
        )}
      </Formik>
    </Modal>
  );
}
