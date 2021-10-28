import * as React from "react";
import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { FullOfficer } from "state/dispatchState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";

interface Props {
  deputy: FullOfficer | null;
  onCreate?: (officer: FullOfficer) => void;
  onUpdate?: (old: FullOfficer, newO: FullOfficer) => void;
  onClose?: () => void;
}

export const ManageDeputyModal = ({ deputy, onClose, onUpdate, onCreate }: Props) => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations();
  const formRef = React.useRef<HTMLFormElement>(null);

  const { state, execute } = useFetch();
  const { department, division } = useValues();

  function handleClose() {
    closeModal(ModalIds.ManageDeputy);
    onClose?.();
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = formRef.current && new FormData(formRef.current);
    const image = fd?.get("image") as File;

    if (image && image.size && image.name) {
      if (!allowedFileExtensions.includes(image.type as AllowedFileExtension)) {
        helpers.setFieldError("image", `Only ${allowedFileExtensions.join(", ")} are supported`);
      }
    }

    let deputyId;

    if (deputy) {
      const { json } = await execute(`/ems-fd/${deputy.id}`, {
        method: "PUT",
        data: values,
      });

      deputyId = deputy.id;

      if (json.id) {
        onUpdate?.(deputy, json);
      }
    } else {
      const { json } = await execute("/ems-fd", {
        method: "POST",
        data: values,
      });

      deputyId = json.id;

      if (json.id) {
        onCreate?.(json);
      }
    }

    if (image && image.size && image.name) {
      await execute(`/ems-fd/image/${deputyId}`, {
        method: "POST",
        data: fd,
      });
    }

    if (deputyId) {
      closeModal(ModalIds.ManageDeputy);
    }
  }

  const validate = handleValidate(CREATE_OFFICER_SCHEMA);
  const INITIAL_VALUES = {
    name: deputy?.name ?? "",
    department: deputy?.departmentId ?? "",
    rank: deputy?.rankId ?? "",
    callsign: deputy?.callsign ?? "",
    division: deputy?.divisionId ?? "",
    badgeNumber: deputy?.badgeNumber ?? "",
    image: undefined,
  };

  return (
    <Modal
      title={deputy ? t("Ems.editDeputy") : t("Ems.createDeputy")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageDeputy)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, handleSubmit, errors, values, isValid }) => (
          <form ref={formRef} onSubmit={handleSubmit}>
            <FormField label={t("Leo.image")}>
              <div className="flex">
                <Input
                  style={{ width: "95%", marginRight: "0.5em" }}
                  onChange={handleChange}
                  type="file"
                  name="image"
                  value={values.image ?? ""}
                />
                <Button
                  type="button"
                  className="bg-red-400 hover:bg-red-500"
                  onClick={() => {
                    setFieldValue("image", "");
                  }}
                >
                  {common("delete")}
                </Button>
              </div>
              <Error>{errors.image}</Error>
            </FormField>

            <FormField label={t("Ems.deputyName")}>
              <Input
                value={values.name}
                hasError={!!errors.name}
                id="name"
                onChange={handleChange}
              />
              <Error>{errors.name}</Error>
            </FormField>

            <FormField label={t("Leo.badgeNumber")}>
              <Input
                type="number"
                value={values.badgeNumber}
                hasError={!!errors.badgeNumber}
                id="badgeNumber"
                onChange={(e) =>
                  handleChange({
                    ...e,
                    target: {
                      ...e.target,
                      id: "badgeNumber",
                      value: e.target.valueAsNumber,
                    },
                  })
                }
              />
              <Error>{errors.badgeNumber}</Error>
            </FormField>

            <FormField label={t("Leo.callsign")}>
              <Input
                value={values.callsign}
                hasError={!!errors.callsign}
                id="callsign"
                onChange={handleChange}
              />
              <Error>{errors.callsign}</Error>
            </FormField>

            <FormField label={t("Leo.department")}>
              <Select
                value={values.department}
                hasError={!!errors.department}
                name="department"
                onChange={handleChange}
                values={department.values.map((value) => ({
                  label: value.value.value,
                  value: value.id,
                }))}
              />
              <Error>{errors.department}</Error>
            </FormField>

            <FormField label={t("Leo.division")}>
              <Select
                value={values.division}
                hasError={!!errors.division}
                name="division"
                onChange={handleChange}
                values={division.values
                  .filter((v) => (values.department ? v.departmentId === values.department : true))
                  .map((value) => ({
                    label: value.value.value,
                    value: value.id,
                  }))}
              />
              <Error>{errors.division}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {deputy ? common("save") : common("create")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
