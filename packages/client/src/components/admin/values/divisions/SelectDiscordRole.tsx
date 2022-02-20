import * as React from "react";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import type { DiscordRole } from "@snailycad/types";
import { useFormikContext } from "formik";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";

let rolesCache: DiscordRole[] = [];

export function SelectDiscordRole() {
  const [roles, setRoles] = React.useState<DiscordRole[]>(rolesCache);
  const { values, handleChange, errors } = useFormikContext<{ discordRoleId: string | null }>();
  const { state, execute } = useFetch();

  React.useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefresh() {
    const { json } = await execute("/admin/manage/cad-settings/discord", {});

    if (Array.isArray(json)) {
      setRoles(json);
      rolesCache = json;
    }
  }

  return (
    <FormField errorMessage={errors.discordRoleId} label="Discord Role">
      <div className="flex gap-2">
        <Select
          disabled={state === "loading"}
          values={roles.map((v) => ({
            value: v.id,
            label: v.name,
          }))}
          name="discordRoleId"
          onChange={handleChange}
          value={values.discordRoleId}
          className="w-full"
        />
        <Button
          className="flex items-center gap-2"
          disabled={state === "loading"}
          type="button"
          onClick={handleRefresh}
        >
          {state === "loading" ? <Loader /> : null}
          Refresh
        </Button>
      </div>
    </FormField>
  );
}
