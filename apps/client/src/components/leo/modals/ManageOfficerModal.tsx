import * as React from "react";
import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
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
import { getUnitDepartment } from "lib/utils";
import { CallSignPreview } from "../CallsignPreview";
import type { IndividualDivisionCallsign, Officer } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitQualificationsTable } from "../qualifications/UnitQualificationsTable";
import { AdvancedSettings } from "./AdvancedSettings";
import { classNames } from "lib/classNames";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type {
  PostMyOfficerByIdData,
  PostMyOfficersData,
  PutMyOfficerByIdData,
} from "@snailycad/types/api";

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
  const formRef = React.useRef<HTMLFormElement>(null);
  const { BADGE_NUMBERS, DIVISIONS } = useFeatureEnabled();

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
      const { json } = await execute<PutMyOfficerByIdData, typeof INITIAL_VALUES>({
        path: `/leo/${officer.id}`,
        method: "PUT",
        data,
        helpers,
      });

      officerId = json?.id;

      if (json.id) {
        onUpdate?.(officer, json);
      }
    } else {
      const { json } = await execute<PostMyOfficersData, typeof INITIAL_VALUES>({
        path: "/leo",
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
      await execute<PostMyOfficerByIdData, typeof INITIAL_VALUES>({
        path: `/leo/image/${officerId}`,
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
    name: officer ? `${officer.citizen.name} ${officer.citizen.surname}` : "",
    image: undefined,
    callsigns: officer ? makeDivisionsObjectMap(officer) : {},
  };

  return (
    <Modal
      title={officer ? t("editOfficer") : t("createOfficer")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageOfficer)}
      className={officer ? "w-[1000px]" : "w-[650px]"}
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, handleSubmit, errors, values, isValid }) => (
          <form
            className={classNames(officer && "flex flex-col md:flex-row gap-5")}
            ref={formRef}
            onSubmit={handleSubmit}
          >
            <div>
              <ImageSelectInput setImage={setImage} image={image} />

              <FormField errorMessage={errors.citizenId} label={t("citizen")}>
                <CitizenSuggestionsField
                  fromAuthUserOnly
                  labelFieldName="name"
                  valueFieldName="citizenId"
                />
              </FormField>

              {BADGE_NUMBERS ? (
                <TextField
                  errorMessage={errors.badgeNumber}
                  label={t("badgeNumber")}
                  name="badgeNumber"
                  onChange={(value) => setFieldValue("badgeNumber", parseInt(value))}
                  value={String(values.badgeNumber)}
                />
              ) : null}

              <FormRow>
                <TextField
                  errorMessage={errors.callsign}
                  label={t("callsign1")}
                  name="callsign"
                  onChange={(value) => setFieldValue("callsign", value)}
                  value={values.callsign}
                />

                <TextField
                  errorMessage={errors.callsign2}
                  label={t("callsign2")}
                  name="callsign2"
                  onChange={(value) => setFieldValue("callsign2", value)}
                  value={values.callsign2}
                />
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

              {DIVISIONS ? (
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
              ) : null}

              <CallSignPreview
                divisions={division.values.filter((v) =>
                  values.divisions.some((d) => d.value === v.id),
                )}
                department={department.values.find((v) => v.id === values.department) ?? null}
              />

              <AdvancedSettings />

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

export function makeDivisionsObjectMap(officer: Officer) {
  const obj = {} as Record<string, IndividualDivisionCallsign>;
  const callsigns = officer.callsigns ?? [];

  for (const callsign of callsigns) {
    if (!callsign.divisionId) continue;
    obj[callsign.divisionId] = callsign;
  }

  return obj;
}
