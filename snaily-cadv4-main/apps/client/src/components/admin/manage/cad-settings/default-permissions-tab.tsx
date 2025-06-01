import { Form, Formik, type FormikHelpers } from "formik";
import { useTranslations } from "use-intl";

import { Alert, Button, Loader, SwitchField, TextField } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import type { cad } from "@snailycad/types";
import { toastMessage } from "lib/toastMessage";
import type { PutCADDefaultPermissionsData } from "@snailycad/types/api";
import { usePermissionsModal } from "hooks/use-permissions-modal";
import { type PermissionNames, getPermissions, defaultPermissions } from "@snailycad/permissions";
import { TabsContent } from "@radix-ui/react-tabs";
import { SettingsTabs } from "components/admin/cad-settings/layout";

export function DefaultPermissionsTab() {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const { DEPRECATED_PERMISSIONS, groups, handleToggleAll } = usePermissionsModal({});
  const t = useTranslations("Permissions");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!cad) return;

    const permissionsArray = Object.keys(values).filter((v) =>
      Boolean(values[v as PermissionNames]),
    );

    const { json } = await execute<PutCADDefaultPermissionsData, typeof INITIAL_VALUES>({
      path: "/admin/manage/cad-settings/default-permissions",
      method: "PUT",
      data: { defaultPermissions: permissionsArray },
      helpers,
    });

    if (json.id) {
      setCad({ ...cad, autoSetUserProperties: json, autoSetUserPropertiesId: json.id });
      toastMessage({
        icon: "success",
        title: common("success"),
        message: common("savedSettingsSuccess"),
      });
    }
  }

  const INITIAL_VALUES = {
    search: "",
    ...getPermissions({
      permissions: createDefaultPermissionsFromDeprecatedAutoSetProperties(cad),
      rank: "USER",
    }),
  };

  return (
    <TabsContent
      aria-label="Default Permissions"
      value={SettingsTabs.DefaultPermissions}
      className="mt-3"
    >
      <h2 className="text-2xl font-semibold">{t("defaultPermissions")}</h2>

      <p className="my-3 text-neutral-700 dark:text-gray-200">{t("defaultPermissionsInfo")}</p>

      <Alert type="warning" title={t("warning")}>
        {t("defaultPermissionsWarning")}
      </Alert>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, setFieldValue, setValues }) => (
          <Form className="mt-5 space-y-5">
            <TextField
              label={common("search")}
              className="my-2"
              name="search"
              value={values.search}
              onChange={(value) => setFieldValue("search", value)}
              placeholder={common("search")}
            />

            <div>
              {groups
                .filter((v) => v.name !== "Owner")
                .map((group) => {
                  const filtered = group.permissions.filter((v) => {
                    const isIncludedInValue = v.toLowerCase().includes(values.search.toLowerCase());
                    const isIncludedInName = t(v)
                      .toLowerCase()
                      .includes(values.search.toLowerCase());

                    return isIncludedInName || isIncludedInValue;
                  });

                  if (filtered.length <= 0) {
                    return null;
                  }

                  return (
                    <div className="mb-5" key={group.name}>
                      <header className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{group.name}</h3>

                        <Button
                          type="button"
                          size="xs"
                          onPress={() => handleToggleAll(group, values, setValues)}
                        >
                          {t("toggleAll")}
                        </Button>
                      </header>

                      <div className="grid grid-cols-1 md:grid-cols-3 mt-5">
                        {filtered.map((permission) => {
                          const formattedName = t(permission);
                          if (DEPRECATED_PERMISSIONS.includes(permission)) {
                            return null;
                          }

                          return (
                            <SwitchField
                              key={permission}
                              isSelected={values[permission as PermissionNames]}
                              onChange={(isSelected) => setFieldValue(permission, isSelected)}
                            >
                              {formattedName}
                            </SwitchField>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            <Button
              className="flex items-center float-right"
              type="submit"
              disabled={state === "loading"}
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

function createDefaultPermissionsFromDeprecatedAutoSetProperties(cad?: cad | null) {
  if (!cad) return [];

  const hasNoNewDefaultPermissionsSet =
    (cad.autoSetUserProperties?.defaultPermissions.length ?? 0) <= 0;
  const _defaultPermissions = cad.autoSetUserProperties?.defaultPermissions ?? [];

  if (cad.autoSetUserProperties?.leo && hasNoNewDefaultPermissionsSet) {
    _defaultPermissions.push(...defaultPermissions.defaultLeoPermissions);
  }

  if (cad.autoSetUserProperties?.dispatch && hasNoNewDefaultPermissionsSet) {
    _defaultPermissions.push(...defaultPermissions.defaultDispatchPermissions);
  }

  if (cad.autoSetUserProperties?.emsFd && hasNoNewDefaultPermissionsSet) {
    _defaultPermissions.push(...defaultPermissions.defaultEmsFdPermissions);
  }

  return _defaultPermissions;
}
