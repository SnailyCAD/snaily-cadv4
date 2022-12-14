import * as React from "react";
import { EMS_FD_DEPUTY_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
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
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitQualificationsTable } from "components/leo/qualifications/UnitQualificationsTable";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type {
  PostMyDeputiesData,
  PostMyDeputyByIdData,
  PutMyDeputyByIdData,
} from "@snailycad/types/api";

interface Props {
  deputy: PostMyDeputiesData | null;
  onCreate?(officer: PostMyDeputiesData): void;
  onUpdate?(old: PutMyDeputyByIdData, newO: PutMyDeputyByIdData): void;
  onClose?(): void;
}

export function ManageDeputyModal({ deputy, onClose, onUpdate, onCreate }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { BADGE_NUMBERS, DIVISIONS } = useFeatureEnabled();

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
      if (typeof validatedImage !== "string") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    let deputyId;

    if (deputy) {
      const { json } = await execute<PutMyDeputyByIdData, typeof INITIAL_VALUES>({
        path: `/ems-fd/${deputy.id}`,
        method: "PUT",
        data: values,
        helpers,
      });

      if (json.id) {
        deputyId = deputy.id;
        onUpdate?.(deputy, json);
      }
    } else {
      const { json } = await execute<PostMyDeputiesData, typeof INITIAL_VALUES>({
        path: "/ems-fd",
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
      await execute<PostMyDeputyByIdData, typeof INITIAL_VALUES>({
        path: `/ems-fd/image/${deputyId}`,
        method: "POST",
        data: fd,
        helpers,
        headers: {
          "content-type": "multipart/form-data",
        },
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
    badgeNumber: BADGE_NUMBERS ? deputy?.badgeNumber ?? undefined : undefined,
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
            <ImageSelectInput image={image} setImage={setImage} />

            <CitizenSuggestionsField
              autoFocus
              allowsCustomValue
              label={t("Leo.citizen")}
              fromAuthUserOnly
              labelFieldName="name"
              valueFieldName="citizenId"
            />

            {BADGE_NUMBERS ? (
              <TextField
                errorMessage={errors.badgeNumber}
                label={t("Leo.badgeNumber")}
                autoFocus
                name="badgeNumber"
                onChange={(value) => {
                  isNaN(parseInt(value))
                    ? setFieldValue("badgeNumber", value)
                    : setFieldValue("badgeNumber", parseInt(value));
                }}
                value={String(values.badgeNumber)}
              />
            ) : null}

            <FormRow>
              <TextField
                errorMessage={errors.callsign}
                label={t("Leo.callsign1")}
                name="callsign"
                onChange={(value) => setFieldValue("callsign", value)}
                value={values.callsign}
              />

              <TextField
                errorMessage={errors.callsign2}
                label={t("Leo.callsign2")}
                name="callsign2"
                onChange={(value) => setFieldValue("callsign2", value)}
                value={values.callsign2}
              />
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

            {DIVISIONS ? (
              <FormField errorMessage={errors.division} label={t("Leo.division")}>
                <Select
                  value={values.division}
                  name="division"
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
            ) : null}

            <CallSignPreview
              divisions={division.values.filter((v) => values.division === v.id)}
              department={department.values.find((v) => v.id === values.department) ?? null}
            />

            {deputy ? <UnitQualificationsTable unit={deputy as any} /> : null}

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
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
