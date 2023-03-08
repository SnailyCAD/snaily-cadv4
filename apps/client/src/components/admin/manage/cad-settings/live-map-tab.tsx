import { Button, Input, Loader, TabsContent } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { SettingsFormField } from "components/form/SettingsFormField";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import type { PutCADApiTokenData } from "@snailycad/types/api";
import Link from "next/link";
import { BoxArrowUpRight } from "react-bootstrap-icons";

const TILE_NAMES = [
  "minimap_sea_0_0",
  "minimap_sea_0_1",
  "minimap_sea_1_0",
  "minimap_sea_1_1",
  "minimap_sea_2_0",
  "minimap_sea_2_1",
];

export function LiveMapTab() {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const t = useTranslations("LiveMapTab");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!cad) return;

    const { json } = await execute<PutCADApiTokenData>({
      path: "/admin/manage/cad-settings/api-token",
      method: "PUT",
      data: values,
    });

    setCad({ ...cad, apiTokenId: json?.id ?? null, apiToken: json });
    toastMessage({
      icon: "success",
      title: common("success"),
      message: common("savedSettingsSuccess"),
    });

    if (json) {
      helpers.setFieldValue("token", json.token);
    }
  }

  const INITIAL_VALUES = {
    liveMapURL: cad?.miscCadSettings?.liveMapURL ?? "",
    tiles: undefined,
  };

  return (
    <TabsContent aria-label={t("liveMap")} value={SettingsTabs.LiveMap}>
      <h2 className="mt-2 text-2xl font-semibold">{t("liveMapSettings")}</h2>

      <p className="my-3 text-neutral-700 dark:text-gray-400 max-w-2xl">
        {t("liveMapSettingsInfo")}
      </p>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form className="mt-3 space-y-5">
            <SettingsFormField
              description={
                <span>
                  This URL will communicate to the live_map resource in your FiveM server.{" "}
                  <Link
                    className="mt-1 underline inline-flex items-center gap-1 text-neutral-700 dark:text-gray-200"
                    target="_blank"
                    href="https://docs.snailycad.org/docs/fivem-integrations/live-map"
                  >
                    Learn more
                    <BoxArrowUpRight className="inline-block" />
                  </Link>
                </span>
              }
              errorMessage={errors.liveMapURL}
              label="Live Map URL"
            >
              <Input
                type="url"
                name="liveMapURL"
                value={values.liveMapURL}
                onChange={handleChange}
                placeholder="http://my-host:my-port"
              />
            </SettingsFormField>

            <SettingsFormField
              description={
                <span>
                  These are the map tiles that will be shown in the live map. These must be named in
                  the following format:{" "}
                  {TILE_NAMES.map((name, idx) => (
                    <>
                      <code key={name}>{name}</code>
                      {idx === TILE_NAMES.length - 1 ? "" : ", "}
                    </>
                  ))}
                </span>
              }
              errorMessage={errors.tiles}
              label={t("mapTiles")}
            >
              <Input
                multiple
                type="file"
                name="tiles"
                value={values.tiles}
                onChange={handleChange}
              />
            </SettingsFormField>

            <div className="flex">
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
