import { DL_EXAM_SCHEMA } from "@snailycad/schemas";
import {
  DLExam,
  DLExamPassType,
  DriversLicenseCategoryType,
  ValueLicenseType,
} from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
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
import type { PostDLExamsData, PutDLExamByIdData } from "@snailycad/types/api";
import Image from "next/future/image";

interface Props {
  exam: DLExam | null;
  type?: "dl" | "weapon";
  onUpdate?(oldExam: DLExam, newExam: DLExam): void;
  onCreate?(exam: DLExam): void;
  onClose?(): void;
}

export function ManageDLExamModal({ exam, type = "dl", onClose, onCreate, onUpdate }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const cT = useTranslations("Vehicles");
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { makeImageUrl } = useImageUrl();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();
  const { driverslicenseCategory, license } = useValues();
  const apiPath = type === "dl" ? "dl-exams" : "weapon-exams";

  const PASS_FAIL_VALUES = [
    { label: cT("passed"), value: DLExamPassType.PASSED },
    { label: cT("failed"), value: DLExamPassType.FAILED },
  ];

  function handleClose() {
    closeModal(ModalIds.ManageDLExam);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const data = {
      ...values,
      categories: values.categories?.map((v) => v.value) ?? [],
    };

    if (exam) {
      const { json } = await execute<PutDLExamByIdData>({
        path: `/leo/${apiPath}/${exam.id}`,
        method: "PUT",
        data,
      });

      if (json.id) {
        closeModal(ModalIds.ManageDLExam);
        onUpdate?.(exam, json);
      }
    } else {
      const { json } = await execute<PostDLExamsData>({
        path: `/leo/${apiPath}`,
        method: "POST",
        data,
      });

      if (json.id) {
        closeModal(ModalIds.ManageDLExam);
        onCreate?.(json);
      }
    }
  }

  const validate = handleValidate(DL_EXAM_SCHEMA);
  const INITIAL_VALUES = {
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

  return (
    <Modal
      title={exam ? t("editDLExam") : t("createDLExam")}
      isOpen={isOpen(ModalIds.ManageDLExam)}
      onClose={handleClose}
      className="min-w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setValues, errors, values }) => (
          <Form>
            <FormField errorMessage={errors.citizenId} label={common("citizen")}>
              <InputSuggestions<NameSearchResult>
                onSuggestionClick={(suggestion) => {
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

            <FormField errorMessage={errors.license} label={t("license")}>
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

            <FormField errorMessage={errors.categories as string} label={t("categories")}>
              <Select
                closeMenuOnSelect={false}
                isMulti
                value={values.categories}
                onChange={handleChange}
                name="categories"
                values={driverslicenseCategory.values
                  .filter((v) =>
                    type === "dl"
                      ? v.type !== DriversLicenseCategoryType.FIREARM
                      : v.type === DriversLicenseCategoryType.FIREARM,
                  )
                  .map((v) => ({
                    label: v.value.value,
                    value: v.id,
                  }))}
              />
            </FormField>

            <FormField errorMessage={errors.theoryExam} label={t("theoryExam")}>
              <Select
                isClearable
                value={values.theoryExam}
                onChange={handleChange}
                name="theoryExam"
                values={PASS_FAIL_VALUES}
              />
            </FormField>

            <FormField errorMessage={errors.practiceExam} label={t("practiceExam")}>
              <Select
                isClearable
                value={values.practiceExam}
                onChange={handleChange}
                name="practiceExam"
                values={PASS_FAIL_VALUES}
              />
            </FormField>

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
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
