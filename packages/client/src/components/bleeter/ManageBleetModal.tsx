import * as React from "react";
import { Formik } from "formik";
import { useTranslations } from "use-intl";
import { useRouter } from "next/router";

import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { BleeterPost } from "types/prisma";
import { Textarea } from "components/form/Textarea";
import { handleValidate } from "lib/handleValidate";
import { BLEETER_SCHEMA } from "@snailycad/schemas";
import { Error } from "components/form/Error";

interface Props {
  post: BleeterPost | null;
}

export const ManageBleetModal = ({ post }: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Bleeter");
  const common = useTranslations("Common");
  const router = useRouter();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    let json: any = {};

    if (post) {
      const data = await execute(`/bleeter/${post.id}`, {
        method: "PUT",
        data: values,
      });

      json = data.json;
    } else {
      const data = await execute("/bleeter", {
        method: "POST",
        data: values,
      });

      json = data.json;
    }

    if (json.id && values.image) {
      const fd = new FormData();

      fd.append("image", values.image, values.image.name);

      if (fd.get("image")) {
        await execute(`/bleeter/${json.id}`, {
          method: "POST",
          data: fd,
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
            <FormField label={t("headerImage")}>
              <Input
                type="file"
                id="image"
                hasError={!!errors.image}
                onChange={(e) => {
                  setFieldValue("image", e.currentTarget.files?.[0]);
                }}
              />
            </FormField>

            <FormField label={t("bleetTitle")}>
              <Input
                id="title"
                value={values.title}
                hasError={!!errors.title}
                onChange={handleChange}
              />
              <Error>{errors.title}</Error>
            </FormField>

            <FormField label={t("bleetBody")}>
              <Textarea
                id="body"
                value={values.body}
                hasError={!!errors.body}
                onChange={handleChange}
                className="min-h-[20em]"
              />
              <Error>{errors.body}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
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
          </form>
        )}
      </Formik>
    </Modal>
  );
};
