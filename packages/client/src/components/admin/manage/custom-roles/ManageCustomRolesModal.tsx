import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import type { CustomRole } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";
import { ModalIds } from "types/ModalIds";
import { CUSTOM_ROLE_SCHEMA } from "@snailycad/schemas";
import { Permissions } from "@snailycad/permissions";
import { formatPermissionName } from "../users/ManagePermissionsModal";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";

interface Props {
  role: CustomRole | null;
  onClose?(): void;
  onUpdate?(old: CustomRole, newRole: CustomRole): void;
  onCreate?(role: CustomRole): void;
}

export function ManageCustomRolesModal({ role, onClose, onCreate, onUpdate }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);

  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Management");

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageCustomRole);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    let jsonId;

    const data = {
      ...values,
      permissions: values.permissions.map((v) => v.value),
    };

    if (role) {
      const { json } = await execute(`/admin/manage/custom-roles/${role.id}`, {
        method: "PUT",
        data,
        helpers,
      });

      if (json?.id) {
        jsonId = json.id;
        closeModal(ModalIds.ManageCustomRole);
        onUpdate?.(role, json);
      }
    } else {
      const { json } = await execute("/admin/manage/custom-roles", {
        method: "POST",
        data,
        helpers,
      });

      if (json?.id) {
        jsonId = json.id;
        closeModal(ModalIds.ManageCustomRole);
        onCreate?.(json);
      }
    }

    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      const fd = new FormData();

      if (typeof validatedImage === "object") {
        fd.set("image", validatedImage, validatedImage.name);
      }

      await execute(`/admin/manage/custom-roles/${jsonId}/image`, {
        method: "POST",
        data: fd,
      });
    }
  }

  const INITIAL_VALUES = {
    name: role?.name ?? "",
    permissions:
      role?.permissions.map((v) => ({
        value: v,
        label: v,
      })) ?? [],
  };

  const validate = handleValidate(CUSTOM_ROLE_SCHEMA);
  return (
    <Modal
      className="w-[600px]"
      title={role ? t("editCustomRole") : t("createCustomRole")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageCustomRole)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
            <FormField errorMessage={errors.name} label={common("name")}>
              <Input autoFocus name="name" onChange={handleChange} value={values.name} />
            </FormField>

            <FormField errorMessage={errors.permissions as string} label="Permissions">
              <Select
                isMulti
                closeMenuOnSelect={false}
                values={Object.values(Permissions).map((permission) => ({
                  value: permission,
                  label: formatPermissionName(permission),
                }))}
                value={values.permissions}
                name="permissions"
                onChange={handleChange}
              />
            </FormField>

            <ImageSelectInput image={image} setImage={setImage} />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {role ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
