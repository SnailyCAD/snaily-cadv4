import { LICENSE_EXAM_SCHEMA } from "@snailycad/schemas";
import {
  LicenseExam,
  LicenseExamPassType,
  DriversLicenseCategoryType,
  ValueLicenseType,
  LicenseExamType,
} from "@snailycad/types";
import { Loader, Button, SelectField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import type { NameSearchResult } from "state/search/nameSearchState";
import type { PostLicenseExamsData, PutLicenseExamByIdData } from "@snailycad/types/api";
import Image from "next/future/image";

interface Props {
  exam: LicenseExam | null;
  onUpdate?(oldExam: LicenseExam, newExam: LicenseExam): void;
  onCreate?(exam: LicenseExam): void;
  onClose?(): void;
}

export function ManageExamModal({ exam, onClose, onCreate, onUpdate }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { makeImageUrl } = useImageUrl();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();
  const { driverslicenseCategory, license } = useValues();

  const PASS_FAIL_VALUES = [
    { label: t("Vehicles.passed"), value: LicenseExamPassType.PASSED },
    { label: t("Vehicles.failed"), value: LicenseExamPassType.FAILED },
  ];

  function handleClose() {
    closeModal(ModalIds.ManageExam);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const data = {
      ...values,
      categories: values.categories?.map((v) => v.value) ?? [],
    };

    if (exam) {
      const { json } = await execute<PutLicenseExamByIdData>({
        path: `/leo/license-exams/${exam.id}`,
        method: "PUT",
        data,
      });

      if (json.id) {
        closeModal(ModalIds.ManageExam);
        onUpdate?.(exam, json);
      }
    } else {
      const { json } = await execute<PostLicenseExamsData>({
        path: "/leo/license-exams",
        method: "POST",
        data,
      });

      if (json.id) {
        closeModal(ModalIds.ManageExam);
        onCreate?.(json);
      }
    }
  }

  const validate = handleValidate(LICENSE_EXAM_SCHEMA);
  const INITIAL_VALUES = {
    type: exam?.type ?? null,
    citizenId: exam?.citizenId ?? null,
    citizenName: exam ? `${exam.citizen.name} ${exam.citizen.surname}` : "",
    theoryExam: exam?.theoryExam ?? null,
    practiceExam: exam?.practiceExam ?? null,
    license: exam?.licenseId ?? null,
    categories:
      exam?.categories?.map((v) => ({
        label: v.value.value,
        value: v.id,
      })) ?? null,
  };

  const filterTypes = {
    [LicenseExamType.DRIVER]: DriversLicenseCategoryType.AUTOMOTIVE,
    [LicenseExamType.FIREARM]: DriversLicenseCategoryType.FIREARM,
    [LicenseExamType.WATER]: DriversLicenseCategoryType.WATER,
    [LicenseExamType.PILOT]: DriversLicenseCategoryType.AVIATION,
  } as const;

  return (
    <Modal
      title={exam ? t("licenseExams.editExam") : t("licenseExams.createExam")}
      isOpen={isOpen(ModalIds.ManageExam)}
      onClose={handleClose}
      className="min-w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, setValues, errors, values }) => (
          <Form>
            <SelectField
              errorMessage={errors.type}
              label={common("type")}
              isDisabled={!!exam}
              name="type"
              options={Object.values(LicenseExamType).map((v) => ({
                label: v.toLowerCase(),
                value: v,
              }))}
              selectedKey={values.type}
              onSelectionChange={(key) => setFieldValue("type", key)}
            />

            <FormField errorMessage={errors.citizenId} label={common("citizen")}>
              <InputSuggestions<NameSearchResult>
                onSuggestionPress={(suggestion) => {
                  setValues({
                    ...values,
                    citizenName: `${suggestion.name} ${suggestion.surname}`,
                    citizenId: suggestion.id,
                  });
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    {suggestion.imageId ? (
                      <Image
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("citizens", suggestion.imageId)!}
                        loading="lazy"
                        width={30}
                        height={30}
                        alt={`${suggestion.name} ${suggestion.surname}`}
                      />
                    ) : null}
                    <p>
                      {suggestion.name} {suggestion.surname}{" "}
                      {SOCIAL_SECURITY_NUMBERS && suggestion.socialSecurityNumber ? (
                        <>(SSN: {suggestion.socialSecurityNumber})</>
                      ) : null}
                    </p>
                  </div>
                )}
                options={{
                  apiPath: "/search/name",
                  method: "POST",
                  dataKey: "name",
                }}
                inputProps={{
                  value: values.citizenName,
                  name: "citizenName",
                  onChange: handleChange,
                  disabled: !!exam,
                }}
              />
            </FormField>

            <FormField errorMessage={errors.license} label={t("Leo.license")}>
              <Select
                value={values.license}
                onChange={handleChange}
                name="license"
                values={license.values
                  .filter((v) =>
                    v.licenseType ? v.licenseType === ValueLicenseType.LICENSE : true,
                  )
                  .map((v) => ({
                    label: v.value,
                    value: v.id,
                  }))}
              />
            </FormField>

            <FormField
              errorMessage={errors.categories as string}
              label={t("licenseExams.categories")}
            >
              <Select
                closeMenuOnSelect={false}
                isMulti
                value={values.categories}
                onChange={handleChange}
                name="categories"
                values={driverslicenseCategory.values
                  .filter((v) => values.type && v.type === filterTypes[values.type])
                  .map((v) => ({
                    label: v.value.value,
                    value: v.id,
                  }))}
              />
            </FormField>

            <SelectField
              isClearable
              label={t("licenseExams.theoryExam")}
              errorMessage={errors.theoryExam}
              isDisabled={!!exam}
              name="theoryExam"
              options={PASS_FAIL_VALUES}
              selectedKey={values.theoryExam}
              onSelectionChange={(key) => setFieldValue("theoryExam", key)}
            />

            <SelectField
              isClearable
              label={t("licenseExams.practiceExam")}
              errorMessage={errors.practiceExam}
              isDisabled={!!exam}
              name="practiceExam"
              options={PASS_FAIL_VALUES}
              selectedKey={values.practiceExam}
              onSelectionChange={(key) => setFieldValue("practiceExam", key)}
            />

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {exam ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
