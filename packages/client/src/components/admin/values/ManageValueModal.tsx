import { VALUE_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import {
  DepartmentType,
  DriversLicenseCategoryType,
  EmployeeAsEnum,
  ShouldDoType,
  ValueType,
} from "types/prisma";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";
import hexColor from "hex-color-regex";
import { TValue } from "src/pages/admin/values/[path]";
import dynamic from "next/dynamic";
import { Eyedropper } from "react-bootstrap-icons";

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

const SHOULD_DO_LABELS = {
  [ShouldDoType.SET_STATUS]: "Set Status",
  [ShouldDoType.SET_OFF_DUTY]: "Set Off duty",
  [ShouldDoType.SET_ON_DUTY]: "Set On duty",
  [ShouldDoType.SET_ASSIGNED]: "Set Assigned",
  [ShouldDoType.PANIC_BUTTON]: "Panic Button",
};

const DEPARTMENT_LABELS = {
  [DepartmentType.LEO]: "LEO",
  [DepartmentType.EMS_FD]: "EMS/FD",
};

const SHOULD_DO_VALUES = Object.values(ShouldDoType).map((v) => ({
  label: SHOULD_DO_LABELS[v],
  value: v,
}));

const DEPARTMENT_TYPES = Object.values(DepartmentType).map((v) => ({
  label: DEPARTMENT_LABELS[v],
  value: v,
}));

export function ManageValueModal({ onCreate, onUpdate, clType: dlType, type, value }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations(type);
  const common = useTranslations("Common");

  const title = !value ? t("ADD") : t("EDIT");
  const footerTitle = !value ? t("ADD") : common("save");
  const { department } = useValues();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (value) {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${value.id}`, {
        method: "PATCH",
        data: { ...values, type: dlType ? dlType : values.type },
      });

      if (json?.id) {
        closeModal("manageValue");
        onUpdate(value, json);
      }
    } else {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}`, {
        method: "POST",
        data: { ...values, type: dlType ? dlType : values.type },
      });

      if (json?.id) {
        closeModal("manageValue");
        onCreate(json);
      }
    }
  }

  const INITIAL_VALUES = {
    value: typeof value?.value === "string" ? value.value : value?.value.value ?? "",
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
    showPicker: false,
  };

  function validate(values: typeof INITIAL_VALUES) {
    const errors = handleValidate(VALUE_SCHEMA);

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
      onClose={() => closeModal("manageValue")}
      isOpen={isOpen("manageValue")}
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

            {["DEPARTMENT", "DIVISION"].includes(type) ? (
              <FormField label="Callsign Symbol">
                <Input name="callsign" onChange={handleChange} value={values.callsign} />
              </FormField>
            ) : null}

            {type === "DEPARTMENT" ? (
              <FormField label="Type">
                <Select
                  values={DEPARTMENT_TYPES}
                  name="type"
                  onChange={handleChange}
                  value={values.type}
                />
              </FormField>
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
              <FormField label="Game Hash">
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
              <Button type="reset" onClick={() => closeModal("manageValue")} variant="cancel">
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
