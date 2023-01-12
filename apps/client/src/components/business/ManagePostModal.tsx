import { Input, Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useBusinessState } from "state/business-state";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { CREATE_COMPANY_POST_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import type { BusinessPost } from "@snailycad/types";
import { dataToSlate, Editor } from "components/editor/editor";
import type { PostBusinessPostsData, PutBusinessPostsData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";

interface Props {
  onCreate(post: BusinessPost): void;
  onUpdate(old: BusinessPost, newPost: BusinessPost): void;
  onClose?(): void;
  post: BusinessPost | null;
}

export function ManageBusinessPostModal({ onClose, onCreate, onUpdate, post }: Props) {
  const { currentBusiness, currentEmployee } = useBusinessState(
    (state) => ({
      currentBusiness: state.currentBusiness,
      currentEmployee: state.currentEmployee,
    }),
    shallow,
  );
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  if (!currentBusiness || !currentEmployee) {
    return null;
  }

  function handleClose() {
    closeModal(ModalIds.ManageBusinessPost);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentEmployee || !currentBusiness) return;

    if (post) {
      const { json } = await execute<PutBusinessPostsData>({
        path: `/businesses/posts/${currentBusiness.id}/${post.id}`,
        method: "PUT",
        data: { ...values, employeeId: currentEmployee.id },
      });

      if (json.id) {
        closeModal(ModalIds.ManageBusinessPost);
        onUpdate(post, json);
      }
    } else {
      const { json } = await execute<PostBusinessPostsData>({
        path: `/businesses/posts/${currentBusiness.id}`,
        method: "POST",
        data: { ...values, employeeId: currentEmployee.id },
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
    bodyData: dataToSlate(post),
    employeeId: currentEmployee.id,
  };

  return (
    <Modal
      className="w-[600px]"
      title={post ? t("editPost") : t("createPost")}
      isOpen={isOpen(ModalIds.ManageBusinessPost)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.title} label={t("postTitle")}>
              <Input name="title" onChange={handleChange} value={values.title} />
            </FormField>

            <FormField errorMessage={errors.body} label={t("postBody")}>
              <Editor value={values.bodyData} onChange={(v) => setFieldValue("bodyData", v)} />
            </FormField>

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
                {post ? common("save") : "Publish Post"}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
