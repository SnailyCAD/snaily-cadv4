import { useAuth } from "context/AuthContext";
import { Form, Formik, type FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { Button, Loader, SwitchField, TabsContent, TextField } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import type {
  DeleteUserRegenerateApiTokenData,
  PutUserEnableDisableApiTokenData,
} from "@snailycad/types/api";

export function UserApiTokenTab() {
  const { user, setUser } = useAuth();
  const t = useTranslations("Account");
  const { execute, state } = useFetch();
  const common = useTranslations("Common");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute<PutUserEnableDisableApiTokenData>({
      path: "/user/api-token",
      method: "PUT",
      data: values,
    });

    if (json) {
      setUser({ ...user, ...json });

      if (json.apiToken) {
        helpers.setFieldValue("token", json.apiToken.token);
      } else {
        helpers.setFieldValue("token", "");
      }
    }
  }

  async function handleRegenerate(
    setFieldValue: FormikHelpers<typeof INITIAL_VALUES>["setFieldValue"],
  ) {
    if (!user) return;

    const { json } = await execute<DeleteUserRegenerateApiTokenData>({
      path: "/user/api-token",
      method: "DELETE",
    });

    if (json.apiToken) {
      setUser({ ...user, ...json });
      setFieldValue("token", json.apiToken.token);
    }
  }

  const INITIAL_VALUES = {
    enabled: user?.apiToken?.enabled ?? false,
    token: user?.apiToken?.token ?? "",
  };

  return (
    <TabsContent aria-label={t("userApiToken")} value="userApiToken">
      <h1 className="text-2xl font-semibold">{t("userApiToken")}</h1>
      <Formik enableReinitialize onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values }) => (
          <Form className="mt-3 space-y-5">
            <SettingsFormField description={t("userApiTokenDescription")} label={t("token")}>
              <TextField
                label={t("token")}
                type="password"
                inputElementType="input"
                onFocus={(event) => (event.target as HTMLInputElement).select()}
                isReadOnly
                value={values.token}
              />
            </SettingsFormField>

            <SettingsFormField
              action="checkbox"
              description={
                <>
                  Read more info about{" "}
                  <a
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-blue-600 underline"
                    href="https://docs.snailycad.org/docs/developer/public-api"
                  >
                    Public API Access here
                  </a>
                  .
                </>
              }
              label={common("enabled")}
            >
              <SwitchField
                aria-label={common("enabled")}
                isSelected={values.enabled}
                onChange={(isSelected) => setFieldValue("enabled", isSelected)}
                name="enabled"
              />
            </SettingsFormField>

            <div className="flex">
              {user?.apiTokenId ? (
                <Button
                  onPress={() => handleRegenerate(setFieldValue)}
                  variant="danger"
                  className="flex items-center mr-2"
                  type="button"
                  disabled={state === "loading"}
                >
                  {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
                  {t("reGenerateToken")}
                </Button>
              ) : null}
              <Button className="flex items-center" type="submit" disabled={state === "loading"}>
                {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
                {common("save")}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </TabsContent>
  );
}
