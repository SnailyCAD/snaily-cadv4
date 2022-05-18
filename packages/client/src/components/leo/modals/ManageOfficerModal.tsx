import * as React from "react";
import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { FormRow } from "components/form/FormRow";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { getUnitDepartment } from "lib/utils";
import { CallSignPreview } from "../CallsignPreview";
import type { Officer } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitQualificationsTable } from "../qualifications/UnitQualificationsTable";
import { AdvancedSettings } from "./AdvancedSettings";
import { classNames } from "lib/classNames";

interface Props {
  officer: Officer | null;
  onCreate?(officer: Officer): void;
  onUpdate?(old: Officer, newO: Officer): void;
  onClose?(): void;
}

export function ManageOfficerModal({ officer, onClose, onUpdate, onCreate }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { citizens } = useCitizen();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { BADGE_NUMBERS } = useFeatureEnabled();

  const { state, execute } = useFetch();
  const { department, division } = useValues();

  function handleClose() {
    closeModal(ModalIds.ManageOfficer);
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

    let officerId;
    const data = {
      ...values,
      helpers,
      divisions: values.divisions.map((v) => v.value),
    };
    if (officer) {
      const { json } = await execute(`/leo/${officer.id}`, {
        method: "PUT",
        data,
        helpers,
      });

      officerId = json?.id;

      if (json.id) {
        onUpdate?.(officer, json);
      }
    } else {
      const { json } = await execute("/leo", {
        method: "POST",
        data,
        helpers,
      });

      officerId = json.id;

      if (json.id) {
        onCreate?.(json);
      }
    }

    if (validatedImage && typeof validatedImage === "object") {
      await execute(`/leo/image/${officerId}`, {
        method: "POST",
        data: fd,
        helpers,
      });
    }

    if (officerId) {
      closeModal(ModalIds.ManageOfficer);
    }
  }

  const validate = handleValidate(CREATE_OFFICER_SCHEMA);
  const INITIAL_VALUES = {
    department: getUnitDepartment(officer)?.id ?? "",
    rank: officer?.rankId ?? "",
    callsign: officer?.callsign ?? "",
    callsign2: officer?.callsign2 ?? "",
    divisions: officer?.divisions.map((v) => ({ value: v.id, label: v.value.value })) ?? [],
    badgeNumber: BADGE_NUMBERS ? officer?.badgeNumber ?? "" : 123,
    citizenId: officer?.citizenId ?? "",
    image: undefined,
    callsigns: officer?.callsigns ?? [],
  };

  return (
    <Modal
      title={officer ? t("editOfficer") : t("createOfficer")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageOfficer)}
      className={officer ? "w-[1000px]" : "w-[650px]"}
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, handleSubmit, errors, values, isValid }) => (
          <form
            className={classNames(officer && "flex flex-col md:flex-row gap-5")}
            ref={formRef}
            onSubmit={handleSubmit}
          >
            <div>
              <ImageSelectInput setImage={setImage} image={image} />

              <FormField errorMessage={errors.citizenId} label={t("citizen")}>
                <Select
                  isClearable
                  value={values.citizenId}
                  name="citizenId"
                  onChange={handleChange}
                  values={citizens.map((value) => ({
                    label: `${value.name} ${value.surname}`,
                    value: value.id,
                  }))}
                />
              </FormField>

              {BADGE_NUMBERS ? (
                <FormField errorMessage={errors.badgeNumber} label={t("badgeNumber")}>
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
              ) : null}

              <FormRow>
                <FormField errorMessage={errors.callsign} label={t("callsign1")}>
                  <Input value={values.callsign} name="callsign" onChange={handleChange} />
                </FormField>

                <FormField errorMessage={errors.callsign2} label={t("callsign2")}>
                  <Input value={values.callsign2} name="callsign2" onChange={handleChange} />
                </FormField>
              </FormRow>

              <FormField errorMessage={errors.department as string} label={t("department")}>
                <Select
                  value={values.department}
                  name="department"
                  onChange={handleChange}
                  values={department.values
                    .filter((v) => v.type === "LEO")
                    .map((value) => ({
                      label: value.value.value,
                      value: value.id,
                    }))}
                />
              </FormField>

              <FormField errorMessage={errors.divisions as string} label={t("division")}>
                <Select
                  isMulti
                  value={values.divisions}
                  name="divisions"
                  onChange={handleChange}
                  values={division.values
                    .filter((v) =>
                      values.department ? v.departmentId === values.department : true,
                    )
                    .map((value) => ({
                      label: value.value.value,
                      value: value.id,
                    }))}
                />
              </FormField>

              <CallSignPreview
                divisions={division.values.filter((v) =>
                  values.divisions.some((d) => d.value === v.id),
                )}
                department={department.values.find((v) => v.id === values.department) ?? null}
              />

              <AdvancedSettings />

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
                  {officer ? common("save") : common("create")}
                </Button>
              </footer>
            </div>

            <div className="md:min-w-[400px]">
              {officer ? <UnitQualificationsTable unit={officer as any} /> : null}
            </div>
          </form>
        )}
      </Formik>
    </Modal>
  );
}
