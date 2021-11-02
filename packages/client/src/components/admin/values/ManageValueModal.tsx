import { VALUE_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
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
  [DepartmentType.LEO]: "Leo",
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

const POSITION_VALUES = new Array(50).fill(0).map((_, idx) => ({
  value: String(idx + 1),
  label: String(idx + 1),
}));

export const ManageValueModal = ({ onCreate, onUpdate, clType: dlType, type, value }: Props) => {
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
    position:
      typeof value?.value === "string" ? "" : value && "position" in value ? value.position : "",
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
    type: value?.type ?? "",
    // @ts-expect-error shortcut
    hash: value?.hash ?? "",
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
        {({ handleSubmit, handleChange, values, errors }) => (
          <form onSubmit={handleSubmit}>
            {type === "DIVISION" ? (
              <FormField fieldId="departmentId" label="Department">
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

            <FormField fieldId="value" label="Value">
              <Input
                autoFocus
                id="value"
                name="value"
                onChange={handleChange}
                value={values.value}
              />
              <Error>{errors.value}</Error>
            </FormField>

            {["DEPARTMENT", "DIVISION"].includes(type) ? (
              <FormField fieldId="callsign" label="Callsign Symbol">
                <Input name="callsign" onChange={handleChange} value={values.callsign} />
              </FormField>
            ) : null}

            {type === "DEPARTMENT" ? (
              <FormField fieldId="type" label="Type">
                <Select
                  values={DEPARTMENT_TYPES}
                  name="type"
                  onChange={handleChange}
                  value={values.type}
                />
              </FormField>
            ) : null}

            {type === "BUSINESS_ROLE" ? (
              <FormField fieldId="as" label="As (this is so the database knows what to use.)">
                <Select
                  values={BUSINESS_VALUES}
                  name="as"
                  onChange={handleChange}
                  value={values.as}
                />
              </FormField>
            ) : null}

            {["VEHICLE", "WEAPON"].includes(type) ? (
              <FormField fieldId="as" label="Game Hash">
                <Input id="hash" onChange={handleChange} value={values.hash} />
              </FormField>
            ) : null}

            {type === "CODES_10" ? (
              <>
                <FormField fieldId="shouldDo" label="Should Do">
                  <Select
                    values={SHOULD_DO_VALUES}
                    name="shouldDo"
                    onChange={handleChange}
                    value={values.shouldDo}
                  />
                </FormField>

                <FormField fieldId="position" label="Position">
                  <Select
                    values={POSITION_VALUES}
                    name="position"
                    onChange={handleChange}
                    value={String(values.position)}
                  />
                </FormField>

                <FormField fieldId="color" label="Color (#HEX)">
                  <Input name="color" onChange={handleChange} value={values.color} />
                  <Error>{errors.color}</Error>
                </FormField>
              </>
            ) : null}

            <footer className="mt-5 flex justify-end">
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
};
