import type { User } from "@snailycad/types";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { FormField } from "components/form/FormField";
import { Form, Formik } from "formik";
import { Loader, Button } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { Select } from "components/form/Select";
import type { GetCustomRolesData, PutManageUserByIdRolesData } from "@snailycad/types/api";

interface Props {
  user: User;
  roles: GetCustomRolesData;
  onUpdate?(user: PutManageUserByIdRolesData): void;
}

export function ManageRolesModal({ roles, user, onUpdate }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();
  const { state, execute } = useFetch();

  async function onSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute<PutManageUserByIdRolesData>({
      path: `/admin/manage/users/roles/${user.id}`,
      method: "PUT",
      data: {
        roles: data.roles.map((v) => v.value),
      },
    });

    if (json.id) {
      closeModal(ModalIds.ManageRoles);
      onUpdate?.(json);
    }
  }

  const INITIAL_VALUES = {
    roles: user.roles?.map((v) => ({ label: v.name, value: v.id })) ?? [],
  };

  return (
    <Modal
      className="w-[750px]"
      title={t("manageRoles")}
      onClose={() => closeModal(ModalIds.ManageRoles)}
      isOpen={isOpen(ModalIds.ManageRoles)}
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values }) => {
          const _roles = values.roles.map((v) => {
            const role = roles.customRoles.find((r) => r.id === v.value);
            return role!;
          });

          const allRolePermissions = [...new Set(_roles.flatMap((r) => r.permissions))];

          return (
            <Form>
              <FormField label={t("roles")} className="my-2">
                <Select
                  values={roles.customRoles.map((role) => ({
                    label: role.name,
                    value: role.id,
                  }))}
                  value={values.roles}
                  onChange={handleChange}
                  name="roles"
                  isMulti
                  closeMenuOnSelect={false}
                />
              </FormField>

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
