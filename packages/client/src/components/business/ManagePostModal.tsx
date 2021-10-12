import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useBusinessState } from "state/businessState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { CREATE_COMPANY_POST_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import { BusinessPost } from "types/prisma";

interface Props {
  onCreate: (post: BusinessPost) => void;
  onUpdate: (old: BusinessPost, newPost: BusinessPost) => void;
  onClose?: () => void;
  post: BusinessPost | null;
}

export const ManageBusinessPostModal = ({ onClose, onCreate, onUpdate, post }: Props) => {
  const { currentBusiness, currentEmployee } = useBusinessState();
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");

  if (!currentBusiness || !currentEmployee) {
    return null;
  }

  function handleClose() {
    closeModal(ModalIds.ManageBusinessPost);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (post) {
      const { json } = await execute(`/businesses/${currentBusiness?.id}/posts`, {
        method: "PUT",
        data: { ...values, employeeId: currentEmployee?.id },
      });

      if (json.id) {
        closeModal(ModalIds.ManageBusinessPost);
        onUpdate(post, json);
      }
    } else {
      const { json } = await execute(`/businesses/${currentBusiness?.id}/posts`, {
        method: "POST",
        data: { ...values, employeeId: currentEmployee?.id },
      });

      if (json.id) {
        closeModal(ModalIds.ManageBusinessPost);
        onCreate(json);
      }
    }
  }

  const validate = handleValidate(CREATE_COMPANY_POST_SCHEMA);
  const INITIAL_VALUES = {
    title: post?.title ?? "",
    body: post?.body ?? "",
    businessId: currentBusiness.id,
    employeeId: currentEmployee.id,
  };

  return (
    <Modal
      className="min-w-[600px]"
      title={post ? "Edit Business Post" : "Create Business Post"}
      isOpen={isOpen(ModalIds.ManageBusinessPost)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField fieldId="title" label={"Title"}>
              <Input
                id="title"
                onChange={handleChange}
                hasError={!!errors.title}
                value={values.title}
              />
              <Error>{errors.title}</Error>
            </FormField>

            <FormField fieldId="body" label={"Body"}>
              <Textarea
                id="body"
                onChange={handleChange}
                hasError={!!errors.body}
                value={values.body}
              />
              <Error>{errors.body}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {post ? common("save") : "Publish Post"}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
