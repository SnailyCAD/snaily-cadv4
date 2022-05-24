import * as React from "react";
import type { CustomRole, User } from "@snailycad/types";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { FormField } from "components/form/FormField";
import { Form, Formik } from "formik";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Select } from "components/form/Select";

interface Props {
  user: User;
  roles: CustomRole[];
}

export function ManageRolesModal({ roles, user }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();
  const { state, execute } = useFetch();

  async function onSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute(`/admin/manage/users/permissions/${user.id}`, {
      method: "PUT",
      data,
    });

    if (json.id) {
      closeModal(ModalIds.ManageRoles);
      user.permissions = json.permissions;
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
        {({ handleChange, values }) => (
          <Form>
            <FormField label={common("search")} className="my-2">
              <Select
                values={roles.map((role) => ({
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
