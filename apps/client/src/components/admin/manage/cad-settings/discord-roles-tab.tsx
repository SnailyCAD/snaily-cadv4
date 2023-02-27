import * as React from "react";
import { Select, SelectValue } from "components/form/Select";
import { Button, Loader, TabsContent } from "@snailycad/ui";
import { Form, Formik, useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import type { DiscordRole, DiscordRoles } from "@snailycad/types";
import { SettingsFormField } from "components/form/SettingsFormField";
import { FormField } from "components/form/FormField";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { formatPermissionName } from "../users/modals/manage-permissions-modal";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import type { GetCADDiscordRolesData, PostCADDiscordRolesData } from "@snailycad/types/api";
import Link from "next/link";
import { BoxArrowUpRight } from "react-bootstrap-icons";

function makeRoleValues(roles: DiscordRole[] | undefined) {
  if (!roles) return [];
  return roles.map((v) => ({
    label: v.name,
    value: v.id,
  }));
}

export function DiscordRolesTab() {
  const { cad } = useAuth();
  const discordRoles = cad?.discordRoles ?? ({} as DiscordRoles);
  const t = useTranslations("DiscordRolesTab");

  const [roles, setRoles] = React.useState<Omit<DiscordRole, "discordRolesId">[]>(
    discordRoles.roles ?? [],
  );
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const tErrors = useTranslations("Errors");

  React.useEffect(() => {
    refreshRoles();
  }, []); // eslint-disable-line

  const INITIAL_VALUES = {
    adminRoles: makeRoleValues(discordRoles.adminRoles),
    leoRoles: makeRoleValues(discordRoles.leoRoles),
    emsFdRoles: makeRoleValues(discordRoles.emsFdRoles),
    dispatchRoles: makeRoleValues(discordRoles.dispatchRoles),
    leoSupervisorRoles: makeRoleValues(discordRoles.leoSupervisorRoles),
    towRoles: makeRoleValues(discordRoles.towRoles),
    taxiRoles: makeRoleValues(discordRoles.taxiRoles),
    courthouseRoles: makeRoleValues(discordRoles.courthouseRoles),
    adminRoleId: discordRoles.adminRoleId,
    whitelistedRoleId: discordRoles.whitelistedRoleId,
    adminRolePermissions: makeValue(discordRoles.adminRolePermissions),
    leoRolePermissions: makeValue(discordRoles.leoRolePermissions),
    leoSupervisorRolePermissions: makeValue(discordRoles.leoSupervisorRolePermissions),
    emsFdRolePermissions: makeValue(discordRoles.emsFdRolePermissions),
    dispatchRolePermissions: makeValue(discordRoles.dispatchRolePermissions),
    towRolePermissions: makeValue(discordRoles.towRolePermissions),
    taxiRolePermissions: makeValue(discordRoles.taxiRolePermissions),
    courthouseRolePermissions: makeValue(discordRoles.courthouseRolePermissions),
  };

  async function refreshRoles() {
    const { json, error } = await execute<GetCADDiscordRolesData>({
      path: "/admin/manage/cad-settings/discord/roles",
      method: "GET",
      noToast: true,
    });

    if (error) {
      setFetchError(error);
    }

    if (Array.isArray(json)) {
      setRoles(json);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    function toValue<T>(arr: SelectValue<T>[]) {
      return arr.map((v) => v.value);
    }

    const { json } = await execute<PostCADDiscordRolesData>({
      path: "/admin/manage/cad-settings/discord/roles",
      method: "POST",
      data: {
        ...values,
        adminRoles: toValue(values.adminRoles),
        leoRoles: toValue(values.leoRoles),
        emsFdRoles: toValue(values.emsFdRoles),
        dispatchRoles: toValue(values.dispatchRoles),
        towRoles: toValue(values.towRoles),
        taxiRoles: toValue(values.taxiRoles),
        courthouseRoles: toValue(values.courthouseRoles),
        leoSupervisorRoles: toValue(values.leoSupervisorRoles),
        adminRolePermissions: toValue(values.adminRolePermissions),
        leoRolePermissions: toValue(values.leoRolePermissions),
        leoSupervisorRolePermissions: toValue(values.leoSupervisorRolePermissions),
        emsFdRolePermissions: toValue(values.emsFdRolePermissions),
        dispatchRolePermissions: toValue(values.dispatchRolePermissions),
        towRolePermissions: toValue(values.towRolePermissions),
        taxiRolePermissions: toValue(values.taxiRolePermissions),
        courthouseRolePermissions: toValue(values.courthouseRolePermissions),
      },
    });

    if (Array.isArray(json)) {
      toastMessage({
        icon: "success",
        title: common("success"),
        message: common("savedSettingsSuccess"),
      });
      setRoles(json);
    }
  }

  return (
    <TabsContent value={SettingsTabs.DiscordRoles}>
      <header>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t("discordRoles")}</h2>

          <Button onPress={refreshRoles} className="h-fit min-w-fit">
            {t("refreshRoles")}
          </Button>
        </div>

        <p className="my-3 text-neutral-700 dark:text-gray-400 max-w-2xl">
          {t("discordRolesInfo")}
        </p>

        <Link
          className="mt-1 underline flex items-center gap-1 text-blue-500"
          target="_blank"
          href="https://docs.snailycad.org/docs/discord-integration/discord-roles"
        >
          {common("learnMore")}
          <BoxArrowUpRight className="inline-block" />
        </Link>
      </header>

      {fetchError ? (
        <div role="alert" className="p-2 px-4 my-4 mb-5 text-black rounded-md shadow bg-red-400">
          <p>{tErrors(fetchError)}</p>
        </div>
      ) : null}

      <Formik enableReinitialize onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form className="mt-5 space-y-5">
            <SettingsFormField
              action="input"
              description={t("adminRoleInfo")}
              errorMessage={errors.adminRoles}
              label={t("adminRole")}
            >
              <Select
                disabled={!!fetchError}
                isClearable
                isMulti
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.adminRoles}
                name="adminRoles"
                onChange={handleChange}
              />

              <SelectPermissionsField
                disabled={!!fetchError}
                name="adminRolePermissions"
                permissions={defaultPermissions.allDefaultAdminPermissions}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t("leoRoleInfo")}
              errorMessage={errors.leoRoles as string}
              label={t("leoRole")}
            >
              <Select
                isClearable
                disabled={!!fetchError}
                isMulti
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.leoRoles}
                name="leoRoles"
                onChange={handleChange}
              />

              <SelectPermissionsField
                disabled={!!fetchError}
                name="leoRolePermissions"
                permissions={defaultPermissions.defaultLeoPermissions}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t("leoSupervisorRoleInfo")}
              errorMessage={errors.leoSupervisorRoles as string}
              label={t("leoSupervisorRole")}
            >
              <Select
                isClearable
                disabled={!!fetchError}
                isMulti
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.leoSupervisorRoles}
                name="leoSupervisorRoles"
                onChange={handleChange}
              />

              <SelectPermissionsField
                disabled={!!fetchError}
                name="leoSupervisorRolePermissions"
                permissions={defaultPermissions.defaultLeoPermissions}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t("emsFdRoleInfo")}
              errorMessage={errors.emsFdRoles as string}
              label={t("emsFdRole")}
            >
              <Select
                isClearable
                disabled={!!fetchError}
                isMulti
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.emsFdRoles}
                name="emsFdRoles"
                onChange={handleChange}
              />

              <SelectPermissionsField
                disabled={!!fetchError}
                name="emsFdRolePermissions"
                permissions={defaultPermissions.defaultEmsFdPermissions}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t("dispatchRoleInfo")}
              errorMessage={errors.dispatchRoles as string}
              label={t("dispatchRole")}
            >
              <Select
                isClearable
                disabled={!!fetchError}
                isMulti
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.dispatchRoles}
                name="dispatchRoles"
                onChange={handleChange}
              />

              <SelectPermissionsField
                disabled={!!fetchError}
                name="dispatchRolePermissions"
                permissions={defaultPermissions.defaultDispatchPermissions}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t("towRoleInfo")}
              errorMessage={errors.towRoles as string}
              label={t("towRole")}
            >
              <Select
                isClearable
                disabled={!!fetchError}
                isMulti
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.towRoles}
                name="towRoles"
                onChange={handleChange}
              />

              <SelectPermissionsField
                disabled={!!fetchError}
                name="towRolePermissions"
                permissions={defaultPermissions.defaultTowPermissions}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t("taxiRoleInfo")}
              errorMessage={errors.taxiRoles as string}
              label={t("taxiRole")}
            >
              <Select
                isClearable
                disabled={!!fetchError}
                isMulti
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.taxiRoles}
                name="taxiRoles"
                onChange={handleChange}
              />

              <SelectPermissionsField
                disabled={!!fetchError}
                name="taxiRolePermissions"
                permissions={defaultPermissions.defaultTaxiPermissions}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t("courthouseRoleInfo")}
              errorMessage={errors.courthouseRoles as string}
              label={t("courthouseRole")}
            >
              <Select
                isClearable
                disabled={!!fetchError}
                isMulti
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.courthouseRoles}
                name="courthouseRoles"
                onChange={handleChange}
              />

              <SelectPermissionsField
                disabled={!!fetchError}
                name="courthouseRolePermissions"
                permissions={defaultPermissions.defaultCourthousePermissions}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t("whitelistedRoleInfo")}
              errorMessage={errors.whitelistedRoleId}
              label={t("whitelistedRole")}
            >
              <Select
                isClearable
                disabled={!!fetchError}
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.whitelistedRoleId}
                name="whitelistedRoleId"
                onChange={handleChange}
              />
            </SettingsFormField>

            <Button
              className="flex items-center"
              type="submit"
              disabled={!!fetchError || state === "loading"}
            >
              {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
              {common("save")}
            </Button>
          </Form>
        )}
      </Formik>
    </TabsContent>
  );
}

function makeValue(permissions: Permissions[] | undefined) {
  if (!permissions || !Array.isArray(permissions)) return [] as SelectValue[];
  return permissions.map((v) => ({ value: formatPermissionName(v), label: v }));
}

function SelectPermissionsField({
  name,
  permissions,
  disabled,
}: {
  name: string;
  permissions: Permissions[];
  disabled: boolean;
}) {
  const { values, errors, handleChange } = useFormikContext<any>();
  const t = useTranslations("DiscordRolesTab");

  return (
    <FormField errorMessage={errors[name] as string} className="mt-2" label={t("permissions")}>
      <Select
        disabled={disabled}
        closeMenuOnSelect={false}
        name={name}
        onChange={handleChange}
        isMulti
        value={values[name]}
        values={permissions.map((v) => ({
          label: formatPermissionName(v),
          value: v,
        }))}
      />
    </FormField>
  );
}
