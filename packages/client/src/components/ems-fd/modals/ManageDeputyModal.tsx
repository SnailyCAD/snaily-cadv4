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
import { FullDeputy } from "state/dispatchState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { FormRow } from "components/form/FormRow";
import { useCitizen } from "context/CitizenContext";
import { CropImageModal } from "components/modal/CropImageModal";

interface Props {
  deputy: FullDeputy | null;
  onCreate?: (officer: FullDeputy) => void;
  onUpdate?: (old: FullDeputy, newO: FullDeputy) => void;
  onClose?(): void;
}

export function ManageDeputyModal({ deputy, onClose, onUpdate, onCreate }: Props) {
  const [image, setImage] = React.useState<File | null>(null);
  const { openModal, isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations();
  const formRef = React.useRef<HTMLFormElement>(null);

  const { citizens } = useCitizen();
  const { state, execute } = useFetch();
  const { department, division } = useValues();

  function handleClose() {
    closeModal(ModalIds.ManageDeputy);
    onClose?.();
  }

  function onCropSuccess(url: Blob, filename: string) {
    setImage(new File([url], filename, { type: url.type }));
    closeModal(ModalIds.CropImageModal);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = new FormData();

    if (image && image.size && image.name) {
      if (!allowedFileExtensions.includes(image.type as AllowedFileExtension)) {
        helpers.setFieldError("image", `Only ${allowedFileExtensions.join(", ")} are supported`);
        return;
      }

      fd.set("image", image, image.name);
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
    citizenId: deputy?.citizenId ?? "",
    department: deputy?.departmentId ?? "",
    rank: deputy?.rankId ?? "",
    callsign: deputy?.callsign ?? "",
    callsign2: deputy?.callsign2 ?? "",
    division: deputy?.divisionId ?? "",
    badgeNumber: deputy?.badgeNumber ?? "",
    image: undefined,
  };

  return (
    <Modal
      title={deputy ? t("Ems.editDeputy") : t("Ems.createDeputy")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageDeputy)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, handleSubmit, errors, values, isValid }) => (
          <form ref={formRef} onSubmit={handleSubmit}>
            <FormField label={t("Leo.image")}>
              <div className="flex">
                <Input
                  style={{ width: "95%", marginRight: "0.5em" }}
                  onChange={(e) => {
                    handleChange(e);
                    setImage(e.target.files?.[0] ?? null);
                  }}
                  type="file"
                  name="image"
                  value={values.image ?? ""}
                />
                <Button
                  className="mr-2"
                  type="button"
                  onClick={() => {
                    openModal(ModalIds.CropImageModal);
                  }}
                >
                  Crop
                </Button>
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

            <FormField label={t("Leo.citizen")}>
              <Select
                isClearable
                value={values.citizenId}
                hasError={!!errors.citizenId}
                name="citizenId"
                onChange={handleChange}
                values={citizens
                  .filter((v) => v)
                  .map((value) => ({
                    label: `${value.name} ${value.surname}`,
                    value: value.id,
                  }))}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

            <FormField label={t("Leo.badgeNumber")}>
              <Input
                type="number"
                value={values.badgeNumber}
                hasError={!!errors.badgeNumber}
                name="badgeNumber"
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

            <FormRow>
              <FormField label={"Callsign Symbol 1"}>
                <Input
                  value={values.callsign}
                  hasError={!!errors.callsign}
                  name="callsign"
                  onChange={handleChange}
                />
                <Error>{errors.callsign}</Error>
              </FormField>

              <FormField label={"Callsign Symbol 2"}>
                <Input
                  value={values.callsign2}
                  hasError={!!errors.callsign2}
                  name="callsign2"
                  onChange={handleChange}
                />
                <Error>{errors.callsign2}</Error>
              </FormField>
            </FormRow>

            <FormField label={t("Leo.department")}>
              <Select
                value={values.department}
                hasError={!!errors.department}
                name="department"
                onChange={handleChange}
                values={department.values
                  .filter((v) => v.type === "EMS_FD")
                  .map((value) => ({
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

            <footer className="flex justify-end mt-5">
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

            <CropImageModal
              isOpen={isOpen(ModalIds.CropImageModal)}
              onClose={() => closeModal(ModalIds.CropImageModal)}
              image={image}
              onSuccess={onCropSuccess}
            />
          </form>
        )}
      </Formik>
    </Modal>
  );
}
