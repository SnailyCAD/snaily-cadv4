import { Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";
import { useRouter } from "next/router";

import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import type { BleeterPost } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { BLEETER_SCHEMA } from "@snailycad/schemas";
import { CropImageModal } from "components/modal/CropImageModal";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";

interface Props {
  post: BleeterPost | null;
}

export function ManageBleetModal({ post }: Props) {
  const { state, execute } = useFetch();
  const { openModal, isOpen, closeModal } = useModal();
  const t = useTranslations("Bleeter");
  const common = useTranslations("Common");
  const router = useRouter();

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
      const data = await execute(`/bleeter/${post.id}`, {
        method: "PUT",
        data: values,
        helpers,
      });

      json = data.json;
    } else {
      const data = await execute("/bleeter", {
        method: "POST",
        data: values,
        helpers,
      });

      json = data.json;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (json.id && values.image) {
      const fd = new FormData();

      fd.append("image", values.image, values.image.name);

      if (fd.get("image")) {
        await execute(`/bleeter/${json.id}`, {
          method: "POST",
          data: fd,
          helpers,
        });
      }
    }

    if (json.id) {
      handleClose();
      router.push(`/bleeter/${json.id}`);
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
        {({ handleSubmit, handleChange, setFieldValue, isValid, values, errors }) => (
          <form onSubmit={handleSubmit}>
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
                  onClick={() => {
                    openModal(ModalIds.CropImageModal);
                  }}
                >
                  Crop
                </Button>
              </div>
            </FormField>

            <FormField errorMessage={errors.title} label={t("bleetTitle")}>
              <Input name="title" value={values.title} onChange={handleChange} />
            </FormField>

            <FormField errorMessage={errors.body} label={t("bleetBody")}>
              <Editor value={values.bodyData} onChange={(v) => setFieldValue("bodyData", v)} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageBleetModal)}
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
          </form>
        )}
      </Formik>
    </Modal>
  );
}
