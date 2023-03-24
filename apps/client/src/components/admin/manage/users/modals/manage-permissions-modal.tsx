import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { getPermissions, PermissionNames, Permissions } from "@snailycad/permissions";
import { FormField } from "components/form/FormField";
import { Toggle } from "components/form/Toggle";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { Loader, Button, TextField } from "@snailycad/ui";
import type { GetManageUserByIdData, PutManageUserPermissionsByIdData } from "@snailycad/types/api";
import { usePermissionsModal } from "hooks/use-permissions-modal";

interface Props {
  user: Pick<GetManageUserByIdData, "permissions" | "id" | "roles" | "rank">;
  isReadOnly?: boolean;
  onUpdate?(user: PutManageUserPermissionsByIdData): void;
}

export function ManagePermissionsModal({ user, onUpdate, isReadOnly }: Props) {
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();
  const userPermissions = getPermissions(user);
  const { state, execute } = useFetch();
  const { DEPRECATED_PERMISSIONS, groups, handleToggleAll } = usePermissionsModal({ isReadOnly });

  async function onSubmit(data: typeof INITIAL_VALUES) {
    if (isReadOnly) return;

    const { json } = await execute<PutManageUserPermissionsByIdData>({
      path: `/admin/manage/users/permissions/${user.id}`,
      method: "PUT",
      data: makePermissionsData(data),
    });

    if (json.id) {
      closeModal(ModalIds.ManagePermissions);
      onUpdate?.(json);
    }
  }

  const INITIAL_VALUES = {
    ...userPermissions,
  };

  return (
    <Modal
      className="w-[1200px]"
      title={t("managePermissions")}
      onClose={() => closeModal(ModalIds.ManagePermissions)}
      isOpen={isOpen(ModalIds.ManagePermissions)}
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setValues, values }) => (
          <Form>
            <TextField
              label={common("search")}
              className="my-2"
              name="search"
              value={search}
              onChange={(value) => setSearch(value)}
              placeholder={common("search")}
            />

            <div>
              {groups.map((group) => {
                const filtered = group.permissions.filter((v) =>
                  v.toLowerCase().includes(search.toLowerCase()),
                );

                if (filtered.length <= 0) {
                  return null;
                }

                return (
                  <div className="mb-5" key={group.name}>
                    <header className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{group.name}</h3>

                      {isReadOnly ? null : (
                        <Button
                          type="button"
                          size="xs"
                          onPress={() => handleToggleAll(group, values, setValues)}
                        >
                          Toggle all
                        </Button>
                      )}
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3">
                      {filtered.map((permission) => {
                        const formattedName = formatPermissionName(permission);
                        const isDisabled = user.roles?.some((r) =>
                          r.permissions.includes(permission),
                        );

                        if (DEPRECATED_PERMISSIONS.includes(permission)) {
                          return null;
                        }

                        return (
                          <FormField key={permission} className="my-1" label={formattedName}>
                            <Toggle
                              onCheckedChange={handleChange}
                              value={values[permission as PermissionNames]}
                              name={permission}
                              disabled={isReadOnly || isDisabled}
                            />
                          </FormField>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
        )}
      </Formik>
    </Modal>
  );
}

function makePermissionsData(data: Record<PermissionNames, boolean>) {
  const newPermissions: ([] | [PermissionNames, Permissions])[] = Object.entries(data).map(
    ([permission, value]) =>
      value ? [permission as PermissionNames, Permissions[permission as PermissionNames]] : [],
  );

  return Object.fromEntries(newPermissions);
}

export function formatPermissionName(permission: string) {
  // todo: whoops
  if (permission === Permissions.ManageDMV) return "Manage DMV";
  if (permission === Permissions.ManageCADSettings) return "Manage CAD-Settings";

  return permission.match(/[A-Z][a-z]+/g)?.join(" ") ?? permission;
}
