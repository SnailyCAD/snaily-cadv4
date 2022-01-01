import * as React from "react";
import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
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
import { FormRow } from "components/form/FormRow";
import { useCitizen } from "context/CitizenContext";
import { ImageSelectInput, validateFile } from "components/form/ImageSelectInput";

interface Props {
  deputy: FullDeputy | null;
  onCreate?: (officer: FullDeputy) => void;
  onUpdate?: (old: FullDeputy, newO: FullDeputy) => void;
  onClose?(): void;
}

export function ManageDeputyModal({ deputy, onClose, onUpdate, onCreate }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const { isOpen, closeModal } = useModal();
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

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = new FormData();
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage === "object") {
        fd.set("image", validatedImage, validatedImage.name);
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

    if (validatedImage && typeof validatedImage === "object") {
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
        {({ handleChange, handleSubmit, errors, values, isValid }) => (
          <form ref={formRef} onSubmit={handleSubmit}>
            <ImageSelectInput image={image} setImage={setImage} />

            <FormField errorMessage={errors.citizenId} label={t("Leo.citizen")}>
              <Select
                isClearable
                value={values.citizenId}
                name="citizenId"
                onChange={handleChange}
                values={citizens
                  .filter((v) => v)
                  .map((value) => ({
                    label: `${value.name} ${value.surname}`,
                    value: value.id,
                  }))}
              />
            </FormField>

            <FormField errorMessage={errors.badgeNumber} label={t("Leo.badgeNumber")}>
              <Input
                type="number"
                value={values.badgeNumber}
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
            </FormField>

            <FormRow>
              <FormField errorMessage={errors.callsign} label={"Callsign Symbol 1"}>
                <Input value={values.callsign} name="callsign" onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.callsign2} label={"Callsign Symbol 2"}>
                <Input value={values.callsign2} name="callsign2" onChange={handleChange} />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.department} label={t("Leo.department")}>
              <Select
                value={values.department}
                name="department"
                onChange={handleChange}
                values={department.values
                  .filter((v) => v.type === "EMS_FD")
                  .map((value) => ({
                    label: value.value.value,
                    value: value.id,
                  }))}
              />
            </FormField>

            <FormField errorMessage={errors.division} label={t("Leo.division")}>
              <Select
                value={values.division}
                name="division"
                onChange={handleChange}
                values={division.values
                  .filter((v) => (values.department ? v.departmentId === values.department : true))
                  .map((value) => ({
                    label: value.value.value,
                    value: value.id,
                  }))}
              />
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
          </form>
        )}
      </Formik>
    </Modal>
  );
}
