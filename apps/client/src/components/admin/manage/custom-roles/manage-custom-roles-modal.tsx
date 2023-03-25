import * as React from "react";
import { FormField } from "components/form/FormField";
import { Button, Loader, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import type { CustomRole, DiscordRole } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";
import { ModalIds } from "types/ModalIds";
import { CUSTOM_ROLE_SCHEMA } from "@snailycad/schemas";
import { Permissions } from "@snailycad/permissions";
import { formatPermissionName } from "../users/modals/manage-permissions-modal";
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
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Management");

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageCustomRole);
  }

  async function refreshRoles() {
    const { json } = await execute<GetCADDiscordRolesData>({
      path: "/admin/manage/cad-settings/discord/roles",
      method: "GET",
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
      permissions: values.permissions.map((v) => v.value),
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
        closeModal(ModalIds.ManageCustomRole);
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
        closeModal(ModalIds.ManageCustomRole);
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
        {({ handleChange, setFieldValue, values, errors }) => (
          <Form>
            <TextField
              errorMessage={errors.name}
              label={common("name")}
              autoFocus
              name="name"
              onChange={(value) => setFieldValue("name", value)}
              value={values.name}
            />

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

            <FormField optional errorMessage={errors.discordRoleId as string} label="Discord Role">
              <Select
                values={discordRoles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.discordRoleId}
                name="discordRoleId"
                onChange={handleChange}
                isClearable
              />
            </FormField>

            <ImageSelectInput image={image} setImage={setImage} />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
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
