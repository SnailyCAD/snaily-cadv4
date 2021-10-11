import { TOW_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "context/ModalContext";
import { Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import toast from "react-hot-toast";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

export const CreateTowCallModal = () => {
  const common = useTranslations("Common");
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { citizens } = useCitizen();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/tow", {
      method: "POST",
      data: values,
    });

    if (json.id) {
      // todo: add translation
      toast.success("Created.");
      closeModal(ModalIds.CreateTowCall);
    }
  }

  const INITIAL_VALUES = {
    location: "",
    creatorId: "",
    description: "",
  };

  const validate = handleValidate(TOW_SCHEMA);

  return (
    <Modal
      onClose={() => closeModal(ModalIds.CreateTowCall)}
      title={"Create Tow Call"}
      isOpen={isOpen(ModalIds.CreateTowCall)}
      className="min-w-[700px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleSubmit, handleChange, values, isValid, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormField label={"Citizen"}>
                <Select
                  name="creatorId"
                  onChange={handleChange}
                  values={citizens.map((citizen) => ({
                    label: `${citizen.name} ${citizen.surname}`,
                    value: citizen.id,
                  }))}
                  value={values.creatorId}
                />
                <Error>{errors.creatorId}</Error>
              </FormField>

              <FormField label={"Location"}>
                <Input onChange={handleChange} name="location" value={values.location} />
                <Error>{errors.location}</Error>
              </FormField>
            </FormRow>

            <FormField label={common("description")}>
              <Textarea name="description" onChange={handleChange} value={values.description} />
              <Error>{errors.description}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.CreateTowCall)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("create")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
