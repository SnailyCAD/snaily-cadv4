import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { TabsContent } from "components/shared/TabList";
import { Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import type { DiscordRoles } from "@snailycad/types";
import { FormRow } from "components/form/FormRow";

export function DiscordRolesTab() {
  const [roles, setRoles] = React.useState<any[]>([]);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const { cad } = useAuth();

  const discordRoles = React.useMemo(
    () => cad?.discordRoles ?? ({} as DiscordRoles),
    [cad?.discordRoles],
  );

  const INITIAL_VALUES = {
    leoRoleId: discordRoles.leoRoleId,
    emsFdRoleId: discordRoles.emsFdRoleId,
    dispatchRoleId: discordRoles.dispatchRoleId,
    leoSupervisorRoleId: discordRoles.leoSupervisorRoleId,
    towRoleId: discordRoles.towRoleId,
    adminRoleId: discordRoles.adminRoleId,
    whitelistedRoleId: discordRoles.whitelistedRoleId,
  };

  async function refreshRoles() {
    const { json } = await execute("/admin/manage/cad-settings/discord", {});

    if (Array.isArray(json)) {
      setRoles(json);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/admin/manage/cad-settings/discord", {
      method: "POST",
      data: values,
    });

    if (Array.isArray(json)) {
      setRoles(json);
    }
  }

  React.useEffect(() => {
    if (discordRoles.roles) {
      setRoles(discordRoles.roles);
    }
  }, [discordRoles]);

  return (
    <TabsContent value="DISCORD_ROLES_TAB">
      <header>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Discord Roles</h2>

          <Button onClick={refreshRoles} className="h-fit min-w-fit">
            Refresh Roles
          </Button>
        </div>

        <p className="my-3 text-neutral-700 dark:text-gray-200 max-w-2xl">
          When a user authenticates via Discord, the respective permissions will granted to that
          user from their roles
        </p>
      </header>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, handleSubmit, errors, values }) => (
          <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
            <FormField errorMessage={errors.adminRoleId} label="Admin Role">
              <Select
                isClearable
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.adminRoleId}
                name="adminRoleId"
                onChange={handleChange}
              />
            </FormField>

            <FormRow>
              <FormField errorMessage={errors.leoRoleId} label="LEO Role">
                <Select
                  isClearable
                  values={roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                  }))}
                  value={values.leoRoleId}
                  name="leoRoleId"
                  onChange={handleChange}
                />
              </FormField>

              <FormField errorMessage={errors.leoSupervisorRoleId} label="LEO Supervisor Role">
                <Select
                  isClearable
                  values={roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                  }))}
                  value={values.leoSupervisorRoleId}
                  name="leoSupervisorRoleId"
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.emsFdRoleId} label="EMS/FD Role">
              <Select
                isClearable
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.emsFdRoleId}
                name="emsFdRoleId"
                onChange={handleChange}
              />
            </FormField>

            <FormField errorMessage={errors.dispatchRoleId} label="Dispatch Role">
              <Select
                isClearable
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.dispatchRoleId}
                name="dispatchRoleId"
                onChange={handleChange}
              />
            </FormField>

            <FormField errorMessage={errors.towRoleId} label="Tow Role">
              <Select
                isClearable
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.towRoleId}
                name="towRoleId"
                onChange={handleChange}
              />
            </FormField>

            <FormField errorMessage={errors.whitelistedRoleId} label="Whitelisted Role">
              <Select
                isClearable
                values={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.whitelistedRoleId}
                name="whitelistedRoleId"
                onChange={handleChange}
              />
            </FormField>

            <Button className="flex items-center" type="submit" disabled={state === "loading"}>
              {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
              {common("save")}
            </Button>
          </form>
        )}
      </Formik>
    </TabsContent>
  );
}
