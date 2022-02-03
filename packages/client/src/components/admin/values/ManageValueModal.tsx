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
  DepartmentType,
  DriversLicenseCategoryType,
  EmployeeAsEnum,
  ShouldDoType,
  ValueLicenseType,
  ValueType,
} from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";
import hexColor from "hex-color-regex";
import { type TValue, getValueStrFromValue } from "src/pages/admin/values/[path]";
import dynamic from "next/dynamic";
import { Eyedropper } from "react-bootstrap-icons";
import { ModalIds } from "types/ModalIds";
import { Toggle } from "components/form/Toggle";

const HexColorPicker = dynamic(async () => (await import("react-colorful")).HexColorPicker);

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

export const SHOULD_DO_LABELS: Record<ShouldDoType, string> = {
  [ShouldDoType.SET_STATUS]: "Set Status",
  [ShouldDoType.SET_OFF_DUTY]: "Set Off duty",
  [ShouldDoType.SET_ON_DUTY]: "Set On duty",
  [ShouldDoType.SET_ASSIGNED]: "Set Assigned",
  [ShouldDoType.PANIC_BUTTON]: "Panic Button",
};

export const DEPARTMENT_LABELS = {
  [DepartmentType.LEO]: "LEO",
  [DepartmentType.EMS_FD]: "EMS/FD",
};

export const LICENSE_LABELS = {
  [ValueLicenseType.LICENSE]: "License",
  [ValueLicenseType.REGISTRATION_STATUS]: "Registration Status",
};

const SHOULD_DO_VALUES = Object.values(ShouldDoType).map((v) => ({
  label: SHOULD_DO_LABELS[v],
  value: v,
}));

const DEPARTMENT_TYPES = Object.values(DepartmentType).map((v) => ({
  label: DEPARTMENT_LABELS[v] as string,
  value: v,
}));

const LICENSE_TYPES = Object.values(ValueLicenseType).map((v) => ({
  label: LICENSE_LABELS[v] as string,
  value: v,
}));

const SCHEMAS: Partial<Record<ValueType, any>> = {
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

  const title = !value ? t("ADD") : t("EDIT");
  const footerTitle = !value ? t("ADD") : common("save");
  const { department } = useValues();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (value) {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${value.id}`, {
        method: "PATCH",
        data: { ...values, type: dlType ? dlType : values.type },
        helpers,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageValue);
        onUpdate(value, json);
      }
    } else {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}`, {
        method: "POST",
        data: { ...values, type: dlType ? dlType : values.type },
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
    showPicker: false,
  };

  function validate(values: typeof INITIAL_VALUES) {
    const schemaToUse = SCHEMAS[type] ?? VALUE_SCHEMA;
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
        {({ handleSubmit, handleChange, setFieldValue, values, errors }) => (
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

            {["DEPARTMENT", "DIVISION"].includes(type) ? (
              <FormField optional label="Callsign Symbol">
                <Input name="callsign" onChange={handleChange} value={values.callsign} />
              </FormField>
            ) : null}

            {type === "DEPARTMENT" ? (
              <>
                <FormField label="Type">
                  <Select
                    values={DEPARTMENT_TYPES}
                    name="type"
                    onChange={handleChange}
                    value={values.type}
                  />
                </FormField>

                {values.type === DepartmentType.LEO ? (
                  <>
                    <FormField
                      errorMessage={errors.whitelisted as string}
                      checkbox
                      label="Whitelisted"
                    >
                      <Toggle
                        name="whitelisted"
                        toggled={values.whitelisted}
                        onClick={(e) => {
                          e.target.value && setFieldValue("isDefaultDepartment", false);
                          handleChange(e);
                        }}
                      />
                    </FormField>

                    <div className="flex flex-col">
                      <FormField
                        errorMessage={errors.isDefaultDepartment as string}
                        checkbox
                        label="Default Department"
                      >
                        <Toggle
                          name="isDefaultDepartment"
                          toggled={values.isDefaultDepartment}
                          onClick={(e) => {
                            e.target.value && setFieldValue("whitelisted", false);
                            handleChange(e);
                          }}
                        />
                      </FormField>

                      <p className="text-base italic">
                        When a department is whitelisted, you can set 1 department as default. This
                        department will be given to the officer when they are awaiting access or
                        when they were declined.
                      </p>
                    </div>
                  </>
                ) : null}
              </>
            ) : null}

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

            {type === "CODES_10" ? (
              <>
                <FormField label="Should Do">
                  <Select
                    values={SHOULD_DO_VALUES}
                    name="shouldDo"
                    onChange={handleChange}
                    value={values.shouldDo}
                  />
                </FormField>

                <FormField errorMessage={errors.color as string} label="Color (#HEX)">
                  <div className={`flex ${values.showPicker ? "items-start" : ""}`}>
                    {values.showPicker ? (
                      <HexColorPicker
                        color={values.color}
                        onChange={(color) => setFieldValue("color", color)}
                        style={{ width: "100%", height: "150px" }}
                      />
                    ) : (
                      <Input name="color" onChange={handleChange} value={values.color} />
                    )}

                    <Button
                      variant="cancel"
                      className="p-0 px-1 ml-2"
                      type="button"
                      onClick={() => setFieldValue("showPicker", !values.showPicker)}
                      aria-label="Color Picker"
                      title="Color Picker"
                    >
                      <Eyedropper />
                    </Button>
                  </div>
                </FormField>

                <FormField className="mb-0" checkbox label="Status Code">
                  <Input
                    className="w-[max-content] mr-3"
                    type="radio"
                    name="type"
                    onChange={() => setFieldValue("type", "STATUS_CODE")}
                    checked={values.type === "STATUS_CODE"}
                  />
                </FormField>

                <FormField checkbox label="Situation Code">
                  <Input
                    className="w-[max-content] mr-3"
                    type="radio"
                    name="type"
                    onChange={() => setFieldValue("type", "SITUATION_CODE")}
                    checked={values.type === "SITUATION_CODE"}
                  />
                </FormField>
              </>
            ) : null}

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
