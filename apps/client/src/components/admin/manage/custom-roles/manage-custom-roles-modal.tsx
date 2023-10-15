import * as React from "react";
import { Button, Loader, SelectField, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import type { CustomRole, DiscordRole } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/modal-ids";
import { CUSTOM_ROLE_SCHEMA } from "@snailycad/schemas";
import { Permissions } from "@snailycad/permissions";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import type {
  GetCADDiscordRolesData,
  PostCustomRolesData,
  PutCustomRoleByIdData,
} from "@snailycad/types/api";

interface Props {
  role: CustomRole | null;
  onClose?(): void;
  onUpdate?(newRole: CustomRole): void;
  onCreate?(role: CustomRole): void;
}

export function ManageCustomRolesModal({ role, onClose, onCreate, onUpdate }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const [discordRoles, setDiscordRoles] = React.useState<DiscordRole[]>([]);

  const { state, execute } = useFetch();
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Management");
  const tPermission = useTranslations("Permissions");

  function handleClose() {
    onClose?.();
    modalState.closeModal(ModalIds.ManageCustomRole);
  }

  async function refreshRoles() {
    const { json } = await execute<GetCADDiscordRolesData>({
      path: "/admin/manage/cad-settings/discord/roles",
      method: "GET",
      noToast: true,
    });

    if (Array.isArray(json)) {
      setDiscordRoles(json);
    }
  }

  React.useEffect(() => {
    refreshRoles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    let jsonId;

    const data = {
      ...values,
      permissions: values.permissions.map((v) => v),
    };

    if (role) {
      const { json } = await execute<PutCustomRoleByIdData, typeof INITIAL_VALUES>({
        path: `/admin/manage/custom-roles/${role.id}`,
        method: "PUT",
        data,
        helpers,
      });

      if (json?.id) {
        jsonId = json.id;
        modalState.closeModal(ModalIds.ManageCustomRole);
        onUpdate?.(json);
      }
    } else {
      const { json } = await execute<PostCustomRolesData, typeof INITIAL_VALUES>({
        path: "/admin/manage/custom-roles",
        method: "POST",
        data,
        helpers,
      });

      if (json?.id) {
        jsonId = json.id;
        modalState.closeModal(ModalIds.ManageCustomRole);
        onCreate?.(json);
      }
    }

    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      const fd = new FormData();

      if (typeof validatedImage !== "string") {
        fd.set("image", validatedImage, validatedImage.name);
      }

      await execute({
        path: `/admin/manage/custom-roles/${jsonId}/image`,
        method: "POST",
        data: fd,
        headers: {
          "content-type": "multipart/form-data",
        },
      });
    }
  }

  const INITIAL_VALUES = {
    name: role?.name ?? "",
    discordRoleId: role?.discordRoleId ?? null,
    permissions: role?.permissions ?? [],
  };

  const validate = handleValidate(CUSTOM_ROLE_SCHEMA);
  return (
    <Modal
      className="w-[600px]"
      title={role ? t("editCustomRole") : t("createCustomRole")}
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.ManageCustomRole)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors }) => (
          <Form>
            <TextField
              errorMessage={errors.name}
              label={common("name")}
              autoFocus
              name="name"
              onChange={(value) => setFieldValue("name", value)}
              value={values.name}
            />

            <SelectField
              label={t("permissions")}
              errorMessage={errors.permissions}
              selectionMode="multiple"
              selectedKeys={values.permissions}
              options={Object.keys(Permissions).map((permission) => ({
                value: permission,
                label: tPermission(permission),
              }))}
              onSelectionChange={(keys) => setFieldValue("permissions", keys)}
            />

            <SelectField
              errorMessage={errors.discordRoleId}
              isOptional
              label={t("discordRole")}
              isClearable
              options={discordRoles.map((role) => ({
                value: role.id,
                label: role.name,
              }))}
              selectedKey={values.discordRoleId}
              onSelectionChange={(key) => setFieldValue("discordRoleId", key)}
            />

            <ImageSelectInput image={image} setImage={setImage} />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
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
