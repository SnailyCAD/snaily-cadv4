import * as React from "react";
import { EMS_FD_DEPUTY_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { FormRow } from "components/form/FormRow";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { CallSignPreview } from "components/leo/CallsignPreview";
import type { EmsFdDeputy } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitQualificationsTable } from "components/leo/qualifications/UnitQualificationsTable";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import type { NameSearchResult } from "state/search/nameSearchState";

interface Props {
  deputy: EmsFdDeputy | null;
  onCreate?(officer: EmsFdDeputy): void;
  onUpdate?(old: EmsFdDeputy, newO: EmsFdDeputy): void;
  onClose?(): void;
}

export function ManageDeputyModal({ deputy, onClose, onUpdate, onCreate }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { BADGE_NUMBERS, SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();

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
        helpers,
      });

      deputyId = deputy.id;

      if (json.id) {
        onUpdate?.(deputy, json);
      }
    } else {
      const { json } = await execute("/ems-fd", {
        method: "POST",
        data: values,
        helpers,
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
        helpers,
      });
    }

    if (deputyId) {
      closeModal(ModalIds.ManageDeputy);
    }
  }

  const validate = handleValidate(EMS_FD_DEPUTY_SCHEMA);
  const INITIAL_VALUES = {
    citizenId: deputy?.citizenId ?? "",
    name: deputy ? `${deputy.citizen.name} ${deputy.citizen.surname}` : "",
    department: deputy?.departmentId ?? "",
    rank: deputy?.rankId ?? "",
    callsign: deputy?.callsign ?? "",
    callsign2: deputy?.callsign2 ?? "",
    division: deputy?.divisionId ?? "",
    badgeNumber: BADGE_NUMBERS ? deputy?.badgeNumber ?? "" : 123,
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
        {({ handleChange, handleSubmit, setValues, errors, values, isValid }) => (
          <form ref={formRef} onSubmit={handleSubmit}>
            <ImageSelectInput image={image} setImage={setImage} />

            <FormField errorMessage={errors.citizenId} label={t("Leo.citizen")}>
              <InputSuggestions<NameSearchResult>
                onSuggestionClick={(suggestion) => {
                  setValues({
                    ...values,
                    citizenId: suggestion.id,
                    name: `${suggestion.name} ${suggestion.surname}`,
                  });
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    <p>
                      {suggestion.name} {suggestion.surname}{" "}
                      {SOCIAL_SECURITY_NUMBERS && suggestion.socialSecurityNumber ? (
                        <>(SSN: {suggestion.socialSecurityNumber})</>
                      ) : null}
                    </p>
                  </div>
                )}
                options={{
                  apiPath: "/search/name?fromAuthUserOnly=true",
                  method: "POST",
                  dataKey: "name",
                  allowUnknown: false,
                }}
                inputProps={{
                  value: values.name,
                  name: "name",
                  onChange: handleChange,
                  errorMessage: errors.citizenId,
                }}
              />
            </FormField>

            {BADGE_NUMBERS ? (
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
            ) : null}

            <FormRow>
              <FormField errorMessage={errors.callsign} label={t("Leo.callsign1")}>
                <Input value={values.callsign} name="callsign" onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.callsign2} label={t("Leo.callsign2")}>
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

            <CallSignPreview
              divisions={division.values.filter((v) => values.division === v.id)}
              department={department.values.find((v) => v.id === values.department) ?? null}
            />

            {deputy ? <UnitQualificationsTable unit={deputy as any} /> : null}

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
