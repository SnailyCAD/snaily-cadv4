import { Button, Input, Loader, TabsContent } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { SettingsFormField } from "components/form/SettingsFormField";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import type { PutCADMiscSettingsData } from "@snailycad/types/api";
import Link from "next/link";
import { BoxArrowUpRight } from "react-bootstrap-icons";
import { handleValidate } from "lib/handleValidate";
import { LIVE_MAP_SETTINGS } from "@snailycad/schemas";

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

    if (values.tiles) {
      const fileNames = Array.from(values.tiles).map((file) => file.name.split(".")[0]);
      const missing = TILE_NAMES.filter((name) => !fileNames.includes(name));

      if (missing.length > 0) {
        helpers.setErrors({
          tiles: `Missing files: ${missing.join(", ")}`,
        });
      }

      const formData = new FormData();
      const tiles = Array.from(values.tiles);

      for (const tile of tiles) {
        const [name] = tile.name.split(".") as [string, string];
        formData.append("tiles", tile, name);
      }

      toastMessage({
        message:
          "Uploading and processing map tiles. This may take a few minutes. Do not close this page.",
        title: "Processing Tiles",
        icon: "info",
      });

      await execute<PutCADMiscSettingsData>({
        path: "/admin/manage/cad-settings/live-map/tiles",
        method: "PUT",
        data: formData,
        headers: { "content-type": "multipart/form-data" },
      });
    }

    const { json } = await execute<PutCADMiscSettingsData>({
      path: "/admin/manage/cad-settings/live-map",
      method: "PUT",
      data: values,
    });

    if (json?.id) {
      setCad({ ...cad, miscCadSettings: { ...cad.miscCadSettings, ...json } });

      toastMessage({
        icon: "success",
        message: "Successfully updated live map settings.",
      });
    }
  }

  const validate = handleValidate(LIVE_MAP_SETTINGS);
  const INITIAL_VALUES = {
    liveMapURL: cad?.miscCadSettings?.liveMapURL ?? "",
    tiles: undefined as FileList | undefined,
  };

  return (
    <TabsContent aria-label={t("liveMapSettings")} value={SettingsTabs.LiveMap}>
      <h2 className="mt-2 text-2xl font-semibold">{t("liveMapSettings")}</h2>

      <p className="my-3 text-neutral-700 dark:text-gray-400 max-w-2xl">
        {t("liveMapSettingsInfo")}
      </p>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, errors, values }) => (
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
                  <Link
                    className="flex mt-3 underline items-center gap-1 text-neutral-700 dark:text-gray-200"
                    target="_blank"
                    href="https://docs.snailycad.org/docs/fivem-integrations/live-map/how-to-set-custom-map-files"
                  >
                    Learn more
                    <BoxArrowUpRight className="inline-block" />
                  </Link>
                </span>
              }
              errorMessage={errors.tiles}
              label="Map Tiles"
            >
              <Input
                multiple
                type="file"
                name="tiles"
                onChange={(e) => setFieldValue("tiles", e.target.files ?? [])}
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
