import { COURTHOUSE_POST_SCHEMA } from "@snailycad/schemas";
import type { CourthousePost } from "@snailycad/types";
import { Loader, Button, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { DEFAULT_EDITOR_DATA, Editor } from "components/editor/editor";
import type { PostCourthousePostsData, PutCourthousePostsData } from "@snailycad/types/api";

interface Props {
  post: CourthousePost | null;
  onClose?(): void;
  onCreate?(post: CourthousePost): void;
  onUpdate?(post: CourthousePost): void;
}

export function ManageCourtPostModal({ post, onClose, onCreate, onUpdate }: Props) {
  const { closeModal, isOpen } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const t = useTranslations("Courthouse");

  const validate = handleValidate(COURTHOUSE_POST_SCHEMA);
  const INITIAL_VALUES = {
    descriptionData: post?.descriptionData ?? DEFAULT_EDITOR_DATA,
    title: post?.title ?? "",
  };

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageCourthousePost);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (post) {
      const { json } = await execute<PutCourthousePostsData, typeof INITIAL_VALUES>({
        path: `/courthouse-posts/${post.id}`,
        method: "PUT",
        data: values,
        helpers,
      });

      if (json.id) {
        onUpdate?.(json);
        closeModal(ModalIds.ManageCourthousePost);
      }
    } else {
      const { json } = await execute<PostCourthousePostsData, typeof INITIAL_VALUES>({
        path: "/courthouse-posts",
        method: "POST",
        data: values,
        helpers,
      });

      if (json.id) {
        onCreate?.(json);
        closeModal(ModalIds.ManageCourthousePost);
      }
    }
  }

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageCourthousePost)}
      title={post ? t("manageCourthousePost") : t("addCourthousePost")}
      className="w-[750px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, errors, setFieldValue }) => (
          <Form>
            <TextField
              errorMessage={errors.title}
              autoFocus
              isRequired
              label={t("title")}
              value={values.title}
              onChange={(value) => setFieldValue("title", value)}
            />

            <FormField
              label={common("description")}
              errorMessage={errors.descriptionData as string}
            >
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button onPress={handleClose} variant="cancel" type="reset">
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {post ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
