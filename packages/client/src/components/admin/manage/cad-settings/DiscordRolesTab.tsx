import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { TabsContent } from "components/shared/TabList";
import { Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";

export function DiscordRolesTab() {
  const [roles, setRoles] = React.useState<any[]>([]);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");

  const INITIAL_VALUES = {
    leoRoleId: "",
    emsFdRoleId: "",
    dispatchRoleId: "",
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

  return (
    <TabsContent value="DISCORD_ROLES_TAB">
      <header>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Discord Roles</h2>

          <Button onClick={refreshRoles} className="h-fit min-w-fit">
            Refresh Roles
          </Button>
        </div>

        <p className="my-3 text-neutral-700 dark:text-gray-200">
          Connect to a Discord server and set roles for each type.
          <br />
        </p>
      </header>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, handleSubmit, errors, values }) => (
          <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
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
