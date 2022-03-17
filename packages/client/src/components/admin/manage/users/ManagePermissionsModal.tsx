import * as React from "react";
import type { User } from "@snailycad/types";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { getPermissions, PermissionNames, Permissions } from "@snailycad/permissions";
import { FormField } from "components/form/FormField";
import { Toggle } from "components/form/Toggle";
import { Form, Formik } from "formik";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Input } from "components/form/inputs/Input";

interface Props {
  user: User;
}

export function ManagePermissionsModal({ user }: Props) {
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();
  const userPermissions = getPermissions(user.permissions ?? []);
  const permissions = Object.keys(Permissions).filter((v) => isNaN(v as any));
  const { state, execute } = useFetch();

  async function handleSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute(`/admin/manage/users/permissions/${user.id}`, {
      method: "PUT",
      data: makePermissionsData(data),
    });

    // todo
    if (json.id) {
      user.permissions = json.permissions;
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
      <Formik onSubmit={handleSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values }) => (
          <Form>
            <FormField label={common("search")} className="my-2">
              <Input onChange={(e) => setSearch(e.target.value)} value={search} />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-3">
              {permissions
                .filter((v) => v.toLowerCase().includes(search.toLowerCase()))
                .map((name) => {
                  return (
                    <div key={name}>
                      <FormField label={name}>
                        <Toggle
                          onClick={handleChange}
                          toggled={values[name as PermissionNames]}
                          name={name}
                        />
                      </FormField>
                    </div>
                  );
                })}
            </div>

            <Button
              className="flex items-center gap-2"
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
  const newPermissions: Partial<Record<PermissionNames, Permissions>> = {};

  for (const key in data) {
    const permission = data[key as PermissionNames];
    if (!permission) {
      continue;
    }

    newPermissions[key as PermissionNames] = Permissions[key as PermissionNames];
  }

  return newPermissions;
}
