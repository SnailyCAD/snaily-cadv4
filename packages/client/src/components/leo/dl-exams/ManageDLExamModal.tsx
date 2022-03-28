import { DL_EXAM_SCHEMA } from "@snailycad/schemas";
import { Citizen, DLExam, DLExamPassType } from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";

interface Props {
  exam: DLExam | null;
  onUpdate?(oldExam: DLExam, newExam: DLExam): void;
  onCreate?(exam: DLExam): void;
}

const PASS_FAIL_VALUES = [
  { label: "Passed", value: DLExamPassType.PASSED },
  { label: "Failed", value: DLExamPassType.FAILED },
];

export function ManageDLExamModal({ exam, onCreate, onUpdate }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { makeImageUrl } = useImageUrl();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();
  const { driverslicenseCategory } = useValues();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const data = {
      ...values,
      categories: values.categories?.map((v) => v.value) ?? [],
    };

    if (exam) {
      const { json } = await execute(`/leo/dl-exams/${exam.id}`, {
        method: "PUT",
        data,
      });

      if (json.id) {
        closeModal(ModalIds.ManageDLExam);
        onUpdate?.(exam, json);
      }
    } else {
      const { json } = await execute("/leo/dl-exams", {
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
      onClose={() => closeModal(ModalIds.ManageDLExam)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setValues, errors, values }) => (
          <Form>
            <FormField errorMessage={errors.citizenId} label={common("citizen")}>
              <InputSuggestions
                onSuggestionClick={(suggestion: Citizen) => {
                  setValues({
                    ...values,
                    citizenName: `${suggestion.name} ${suggestion.surname}`,
                    citizenId: suggestion.id,
                  });
                }}
                Component={({ suggestion }: { suggestion: Citizen }) => (
                  <div className="flex items-center">
                    {suggestion.imageId ? (
                      <img
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("citizens", suggestion.imageId)}
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
                }}
              />
            </FormField>

            <FormField errorMessage={errors.categories as string} label={t("categories")}>
              <Select
                isMulti
                value={values.categories}
                onChange={handleChange}
                name="categories"
                values={driverslicenseCategory.values.map((v) => ({
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
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageDLExam)}
                variant="cancel"
              >
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
