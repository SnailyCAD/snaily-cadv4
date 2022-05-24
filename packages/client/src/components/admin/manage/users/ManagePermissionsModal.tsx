import * as React from "react";
import type { User } from "@snailycad/types";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import {
  getPermissions,
  defaultPermissions,
  PermissionNames,
  Permissions,
} from "@snailycad/permissions";
import { FormField } from "components/form/FormField";
import { Toggle } from "components/form/Toggle";
import { Form, Formik } from "formik";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { Input } from "components/form/inputs/Input";

interface Props {
  user: User;
  onUpdate?(user: User): void;
}

const groups = [
  {
    name: "Admin",
    permissions: defaultPermissions.allDefaultAdminPermissions,
  },
  {
    name: "LEO",
    permissions: defaultPermissions.defaultLeoPermissions,
  },
  {
    name: "Dispatch",
    permissions: defaultPermissions.defaultDispatchPermissions,
  },
  {
    name: "EMS/FD",
    permissions: defaultPermissions.defaultEmsFdPermissions,
  },
  {
    name: "Citizen related",
    permissions: [
      ...defaultPermissions.defaultTowPermissions,
      ...defaultPermissions.defaultTaxiPermissions,
    ],
  },
  {
    name: "Other",
    permissions: defaultPermissions.otherDefaultPermissions,
  },
];

export function ManagePermissionsModal({ user, onUpdate }: Props) {
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();
  const userPermissions = getPermissions(user.permissions ?? []);
  const { state, execute } = useFetch();

  async function onSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute(`/admin/manage/users/permissions/${user.id}`, {
      method: "PUT",
      data: makePermissionsData(data),
    });

    if (json.id) {
      closeModal(ModalIds.ManagePermissions);
      onUpdate?.(json);
    }
  }

  function handleToggleAll(
    group: typeof groups[number],
    values: Record<string, any>,
    setValues: any,
  ) {
    const shouldSetFalse = group.permissions.every((v) => v === values[v]);

    if (shouldSetFalse) {
      const filtered = Object.values(values)
        .filter((v) => !group.permissions.includes(v))
        .reduce((ac, cv) => ({ ...ac, [cv]: cv }), {});

      setValues({ ...filtered });
    } else {
      const obj = group.permissions.reduce(
        (ac, cv) => ({
          ...ac,
          [cv]: cv,
        }),
        {},
      );

      setValues({ ...values, ...obj });
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
            <FormField label={common("search")} className="my-2">
              <Input onChange={(e) => setSearch(e.target.value)} value={search} />
            </FormField>

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

                      <Button
                        type="button"
                        small
                        onClick={() => handleToggleAll(group, values, setValues)}
                      >
                        Toggle all
                      </Button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3">
                      {filtered.map((permission) => {
                        const formattedName = formatPermissionName(permission);
                        const isDisabled = user.roles?.some((r) =>
                          r.permissions.includes(permission),
                        );

                        return (
                          <FormField key={permission} className="my-1" label={formattedName}>
                            <Toggle
                              onClick={handleChange}
                              toggled={values[permission as PermissionNames]}
                              name={permission}
                              disabled={isDisabled}
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

export function formatPermissionName(permission: string) {
  // todo: whoops
  if (permission === Permissions.ManageDMV) return "Manage DMV";

  return permission.match(/[A-Z][a-z]+/g)?.join(" ") ?? permission;
}
