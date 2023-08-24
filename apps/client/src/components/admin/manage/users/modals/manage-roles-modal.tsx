import type { User } from "@snailycad/types";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { Form, Formik } from "formik";
import { Loader, Button, SelectField } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import type { GetCustomRolesData, PutManageUserByIdRolesData } from "@snailycad/types/api";

interface Props {
  user: User;
  roles: GetCustomRolesData;
  onUpdate?(user: PutManageUserByIdRolesData): void;
}

export function ManageRolesModal({ roles, user, onUpdate }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const modalState = useModal();
  const { state, execute } = useFetch();

  async function onSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute<PutManageUserByIdRolesData>({
      path: `/admin/manage/users/roles/${user.id}`,
      method: "PUT",
      data: {
        roles: data.roles.map((v) => v),
      },
    });

    if (json.id) {
      modalState.closeModal(ModalIds.ManageRoles);
      onUpdate?.(json);
    }
  }

  const INITIAL_VALUES = {
    roles: user.roles?.map((v) => v.id) ?? [],
  };

  return (
    <Modal
      className="w-[750px]"
      title={t("manageRoles")}
      onClose={() => modalState.closeModal(ModalIds.ManageRoles)}
      isOpen={modalState.isOpen(ModalIds.ManageRoles)}
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values }) => {
          const _roles = values.roles.map((roleId) => {
            const role = roles.customRoles.find((r) => r.id === roleId);
            return role!;
          });

          const allRolePermissions = [...new Set(_roles.flatMap((r) => r.permissions))];

          return (
            <Form>
              <SelectField
                label={t("roles")}
                className="my-2"
                selectionMode="multiple"
                selectedKeys={values.roles}
                options={roles.customRoles.map((role) => ({
                  label: role.name,
                  value: role.id,
                }))}
                onSelectionChange={(keys) => setFieldValue("roles", keys)}
              />

              <div className="mt-3">
                <h3 className="text-lg font-semibold">Permissions</h3>

                {allRolePermissions.length <= 0 ? (
                  <p className="text-base mt-3">No roles selected yet.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {allRolePermissions.map((permission) => (
                      <span
                        className="bg-gray-300 dark:bg-tertiary border border-gray-400 dark:border-secondary px-1.5 p-0.5 rounded-md"
                        key={permission}
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="flex items-center gap-2 mt-5"
                type="submit"
                disabled={state === "loading"}
              >
                {state === "loading" ? <Loader /> : null}
                {common("save")}
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
}
