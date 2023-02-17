import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";

import { Loader, Input, Button, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { handleValidate } from "lib/handleValidate";
import { BLEETER_SCHEMA } from "@snailycad/schemas";
import { CropImageModal } from "components/modal/CropImageModal";
import { dataToSlate, Editor } from "components/editor/editor";
import type {
  GetBleeterByIdData,
  PostBleeterByIdData,
  PostBleeterByIdImageData,
  PutBleeterByIdData,
} from "@snailycad/types/api";
import { useRouter } from "next/router";

interface Props {
  post: GetBleeterByIdData | null;

  onCreate?(bleet: PostBleeterByIdData & { isNew?: boolean }): void;
  onUpdate?(bleet: PutBleeterByIdData): void;
}

export function ManageBleetModal({ post, onCreate, onUpdate }: Props) {
  const { state, execute } = useFetch();
  const { openModal, isOpen, closeModal } = useModal();
  const t = useTranslations("Bleeter");
  const common = useTranslations("Common");
  const router = useRouter();
  const shouldReplaceRoute = router.pathname === "/bleeter/[id]";

  function onCropSuccess(url: Blob, filename: string, setImage: any) {
    setImage(new File([url], filename, { type: url.type }));
    closeModal(ModalIds.CropImageModal);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    let json: any = {};

    if (post) {
      const data = await execute<PutBleeterByIdData, typeof INITIAL_VALUES>({
        path: `/bleeter/${post.id}`,
        method: "PUT",
        data: values,
        helpers,
      });

      json = data.json;

      if (json.id) {
        onUpdate?.(json);
      }
    } else {
      const data = await execute<PostBleeterByIdData, typeof INITIAL_VALUES>({
        path: "/bleeter",
        method: "POST",
        data: values,
        helpers,
      });

      json = data.json;

      if (json.id) {
        onCreate?.({ ...json, isNew: true });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (json.id && values.image) {
      const fd = new FormData();

      fd.append("image", values.image, values.image.name);

      if (fd.get("image")) {
        await execute<PostBleeterByIdImageData, typeof INITIAL_VALUES>({
          path: `/bleeter/${json.id}`,
          method: "POST",
          data: fd,
          helpers,
          headers: {
            "content-type": "multipart/form-data",
          },
        });
      }
    }

    if (json.id) {
      handleClose();

      if (shouldReplaceRoute) {
        router.push(`/bleeter/${json.id}`);
      }
    }
  }

  function handleClose() {
    closeModal(ModalIds.ManageBleetModal);
  }

  const validate = handleValidate(BLEETER_SCHEMA);
  const INITIAL_VALUES = {
    title: post?.title ?? "",
    body: post?.body ?? "",
    bodyData: dataToSlate(post),
    image: null as unknown as File,
  };

  return (
    <Modal
      title={post ? t("editBleet") : t("createBleet")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageBleetModal)}
      className="w-[700px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, isValid, values, errors }) => (
          <Form>
            <FormField optional errorMessage={errors.image as string} label={t("headerImage")}>
              <div className="flex">
                <Input
                  style={{ width: "95%", marginRight: "0.5em" }}
                  type="file"
                  name="image"
                  onChange={(e) => {
                    setFieldValue("image", e.currentTarget.files?.[0]);
                  }}
                />
                <Button
                  className="mr-2"
                  type="button"
                  onPress={() => {
                    openModal(ModalIds.CropImageModal);
                  }}
                >
                  {common("crop")}
                </Button>
              </div>
            </FormField>

            <TextField
              errorMessage={errors.title}
              autoFocus
              isRequired
              label={t("bleetTitle")}
              value={values.title}
              onChange={(value) => setFieldValue("title", value)}
            />

            <FormField errorMessage={errors.body} label={t("bleetBody")}>
              <Editor value={values.bodyData} onChange={(v) => setFieldValue("bodyData", v)} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.ManageBleetModal)}
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
                {post ? common("save") : t("createBleet")}
              </Button>
            </footer>

            <CropImageModal
              isOpen={isOpen(ModalIds.CropImageModal)}
              onClose={() => closeModal(ModalIds.CropImageModal)}
              image={values.image}
              onSuccess={(...data) => onCropSuccess(...data, (d: any) => setFieldValue("image", d))}
              options={{ height: 500, aspectRatio: 16 / 9 }}
            />
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
