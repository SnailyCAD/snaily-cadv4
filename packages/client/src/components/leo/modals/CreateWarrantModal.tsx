import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { InputSuggestions } from "components/form/InputSuggestions";
import { Citizen } from "types/prisma";
import { PersonFill } from "react-bootstrap-icons";
import { useImageUrl } from "hooks/useImageUrl";

export const CreateWarrantModal = () => {
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const { makeImageUrl } = useImageUrl();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute("/records/create-warrant", {
      method: "POST",
      data: values,
    });

    if (json.id) {
      // todo: alert success
      helpers.resetForm();
      closeModal(ModalIds.CreateWarrant);
    }
  }

  const INITIAL_VALUES = {
    citizenId: "",
    citizenName: "",
    status: "",
    description: "",
  };

  return (
    <Modal
      title={"Create Warrant"}
      isOpen={isOpen(ModalIds.CreateWarrant)}
      onClose={() => closeModal(ModalIds.CreateWarrant)}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, values, errors, isValid }) => (
          <Form autoComplete="off">
            <FormField label="Name">
              <InputSuggestions
                inputProps={{
                  value: values.citizenName,
                  hasError: !!errors.citizenName,
                  name: "citizenName",
                  onChange: handleChange,
                }}
                onSuggestionClick={(suggestion) => {
                  setFieldValue("citizenId", suggestion.id);
                  setFieldValue("citizenName", `${suggestion.name} ${suggestion.surname}`);
                }}
                options={{
                  apiPath: "/search/name",
                  data: { name: values.citizenName },
                  method: "POST",
                  minLength: 2,
                }}
                Component={({ suggestion }: { suggestion: Citizen }) => (
                  <div className="flex items-center">
                    <div className="mr-2 min-w-[25px]">
                      {suggestion.imageId ? (
                        <img
                          className="rounded-md w-[35px] h-[35px] object-cover"
                          draggable={false}
                          src={makeImageUrl("citizens", suggestion.imageId)}
                        />
                      ) : (
                        <PersonFill className="text-gray-500/60 w-[25px] h-[25px]" />
                      )}
                    </div>
                    <p>
                      {suggestion.name} {suggestion.surname}
                    </p>
                  </div>
                )}
              />
            </FormField>

            <FormField label="Status">
              <Select
                values={[
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                ]}
                name="status"
                onChange={handleChange}
                hasError={!!errors.status}
                value={values.status}
              />
            </FormField>

            <FormField label={common("description")}>
              <Textarea
                id="description"
                onChange={handleChange}
                hasError={!!errors.description}
                value={values.description}
              />
            </FormField>

            <Button
              className="flex items-center"
              disabled={!isValid || state === "loading"}
              type="submit"
            >
              {state === "loading" ? <Loader className="mr-2" /> : null}
              {common("create")}
            </Button>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
