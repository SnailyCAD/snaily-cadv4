import * as React from "react";
import { TabsContent } from "components/shared/TabList";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { PasswordInput } from "components/form/inputs/Input";
import { Toggle } from "components/form/Toggle";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import { Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";

export function ApiTokenTab() {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad } = useAuth();
  const t = useTranslations("Management");

  const [token, setToken] = React.useState("");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/admin/manage/cad-settings/api-token", {
      method: "PUT",
      data: values,
    });

    if (json.token) {
      setToken(json.token);
    }
  }

  async function handleRegenerate() {
    const { json } = await execute("/admin/manage/cad-settings/api-token", {
      method: "DELETE",
    });

    if (json.token) {
      setToken(json.token);
    }
  }

  function handleClick(e: React.MouseEvent<HTMLInputElement>) {
    const t = e.target as HTMLInputElement;
    t.select();
  }

  const INITIAL_VALUES = {
    enabled: cad?.apiToken?.enabled ?? false,
    token: cad?.apiToken?.token ?? "",
  };

  return (
    <TabsContent aria-label="API Token" value="API_TOKEN">
      <h2 className="mt-2 text-2xl font-semibold">Public API access</h2>

      <p className="my-2">
        Read more info about{" "}
        <a
          target="_blank"
          rel="noreferrer noopener"
          className="text-blue-600 underline"
          href="https://cad-docs.netlify.com/other/public-api"
        >
          Public API Access here
        </a>
      </p>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, handleSubmit, values }) => (
          <form className="mt-3 space-y-5" onSubmit={handleSubmit}>
            <FormField label="Token">
              <PasswordInput
                onChange={void 0}
                onClick={handleClick}
                readOnly
                value={token || values.token}
              />
            </FormField>

            <FormField label={common("enabled")}>
              <Toggle toggled={values.enabled} onClick={handleChange} name="enabled" />
            </FormField>

            <div className="flex">
              {cad?.apiTokenId ? (
                <Button
                  onClick={handleRegenerate}
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
          </form>
        )}
      </Formik>
    </TabsContent>
  );
}
