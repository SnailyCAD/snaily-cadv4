import * as Popover from "@radix-ui/react-popover";
import * as React from "react";
import { Alert, Button, Input, Loader, TabsContent, TextField } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { Form, Formik, FormikHelpers, useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { SettingsFormField } from "components/form/SettingsFormField";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import type { PutCADMiscSettingsData } from "@snailycad/types/api";
import Link from "next/link";
import { BoxArrowUpRight, ChevronDown } from "react-bootstrap-icons";
import { handleValidate } from "lib/handleValidate";
import { LIVE_MAP_SETTINGS } from "@snailycad/schemas";
import { Table, useTableState } from "components/shared/Table";

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
  const tableState = useTableState();
  const [openPopover, setOpenPopover] = React.useState<"edit" | "add" | null>(null);

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
    liveMapURLs: cad?.miscCadSettings?.liveMapURLs ?? [],
    tiles: undefined as FileList | undefined,
  };

  return (
    <TabsContent aria-label={t("liveMapSettings")} value={SettingsTabs.LiveMap}>
      <h2 className="mt-2 text-2xl font-semibold">{t("liveMapSettings")}</h2>

      <p className="my-3 text-neutral-700 dark:text-gray-400 max-w-2xl">
        {t("liveMapSettingsInfo")}
      </p>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, errors, values }) => (
          <Form className="mt-3 space-y-5">
            <SettingsFormField
              description={
                <span>
                  {t("liveMapUrlDescription")}{" "}
                  <Link
                    className="mt-1 underline inline-flex items-center gap-1 text-neutral-700 dark:text-gray-200"
                    target="_blank"
                    href="https://docs.snailycad.org/docs/fivem-integrations/live-map"
                  >
                    {common("learnMore")}
                    <BoxArrowUpRight className="inline-block" />
                  </Link>
                </span>
              }
              errorMessage={errors.liveMapURLs}
              label={
                <div className="flex items-center justify-between">
                  {t("liveMapURLs")}

                  <ManageURLPopover
                    trigger={
                      <Button
                        onPress={() => setOpenPopover("add")}
                        size="xs"
                        className="text-base flex gap-2 items-center"
                      >
                        {t("addURL")}
                        <ChevronDown className="w-3 mt-0.5" />
                      </Button>
                    }
                    url={null}
                    isPopoverOpen={openPopover === "add"}
                    setIsPopoverOpen={(v) => setOpenPopover(v ? "add" : null)}
                  />
                </div>
              }
            >
              {values.liveMapURLs.length <= 0 ? (
                <>
                  <p className="text-neutral-500 dark:text-gray-400">{t("noLiveMapUrls")}</p>

                  {values.liveMapURL ? (
                    <Alert
                      className="mt-3"
                      type="success"
                      title={t("foundPreviousLiveMapURLTitle")}
                    >
                      <span className="font-medium">{t("foundPreviousLiveMapURLDescription")}</span>

                      <Button
                        className="mt-3 max-w-fit"
                        onPress={() => {
                          setFieldValue("liveMapURLs", [
                            { url: values.liveMapURL, name: "Default" },
                          ]);
                          setFieldValue("liveMapURL", null);
                        }}
                      >
                        {t("addURL")}
                      </Button>
                    </Alert>
                  ) : null}
                </>
              ) : (
                <Table
                  tableState={tableState}
                  data={values.liveMapURLs.map((url) => ({
                    id: `${url.url}-${url.id}`,
                    name: url.name,
                    url: url.url,
                    actions: (
                      <>
                        <ManageURLPopover
                          trigger={
                            <Button
                              onPress={() => setOpenPopover("edit")}
                              size="xs"
                              variant="success"
                              className="text-base flex gap-2 items-center mr-2"
                            >
                              {common("edit")}
                              <ChevronDown className="w-3 mt-0.5" />
                            </Button>
                          }
                          url={url}
                          isPopoverOpen={openPopover === "edit"}
                          setIsPopoverOpen={(v) => setOpenPopover(v ? "edit" : null)}
                        />

                        <Button
                          onPress={() => {
                            setFieldValue(
                              "liveMapURLs",
                              [...values.liveMapURLs].filter((u) => u.url !== url.url),
                              true,
                            );
                          }}
                          size="xs"
                          variant="danger"
                        >
                          {common("delete")}
                        </Button>
                      </>
                    ),
                  }))}
                  columns={[
                    { header: common("name"), accessorKey: "name" },
                    { header: common("url"), accessorKey: "url" },
                    { header: common("actions"), accessorKey: "actions" },
                  ]}
                />
              )}
            </SettingsFormField>

            <SettingsFormField
              description={
                <span>
                  {t("mapTilesDescription")}{" "}
                  {TILE_NAMES.map((name, idx) => (
                    <React.Fragment key={idx}>
                      <code key={idx}>{name}</code>
                      {idx === TILE_NAMES.length - 1 ? "" : ", "}
                    </React.Fragment>
                  ))}
                  <Link
                    className="flex mt-3 underline items-center gap-1 text-neutral-700 dark:text-gray-200"
                    target="_blank"
                    href="https://docs.snailycad.org/docs/fivem-integrations/live-map/how-to-set-custom-map-files"
                  >
                    {common("learnMore")}
                    <BoxArrowUpRight className="inline-block" />
                  </Link>
                </span>
              }
              errorMessage={errors.tiles}
              label={t("mapTiles")}
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

interface ManageURLPopoverProps {
  trigger: React.ReactNode;
  isPopoverOpen: boolean;
  setIsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  url?: { url: string; id: string; name: string } | null;
}

function ManageURLPopover(props: ManageURLPopoverProps) {
  const t = useTranslations("LiveMapTab");
  const common = useTranslations("Common");
  const { values, setFieldValue } = useFormikContext<{
    liveMapURLs: NonNullable<ManageURLPopoverProps["url"]>[];
  }>();

  const [name, setName] = React.useState(props.url?.name ?? "");
  const [url, setUrl] = React.useState(props.url?.url ?? "");

  React.useEffect(() => {
    setName(props.url?.name ?? "");
    setUrl(props.url?.url ?? "");
  }, [props.url]);

  function handleSubmit() {
    const existsInUrl = values.liveMapURLs.some((url) => url.url === props.url?.url);

    if (!existsInUrl) {
      setFieldValue("liveMapURLs", [...values.liveMapURLs, { name, url }]);
    } else {
      const newLiveMapURls = values.liveMapURLs.map((u) => {
        if (u.id === props.url?.id) {
          return { ...u, name, url };
        }

        return url;
      });

      setFieldValue("liveMapURLs", newLiveMapURls);
    }

    props.setIsPopoverOpen(false);
  }

  return (
    <Popover.Root open={props.isPopoverOpen} onOpenChange={props.setIsPopoverOpen}>
      <Popover.Trigger asChild>
        <span>{props.trigger}</span>
      </Popover.Trigger>

      <Popover.Content className="z-50 p-4 bg-gray-200 rounded-md shadow-md dropdown-fade w-96 dark:bg-primary dark:border dark:border-secondary text-base font-normal">
        <h3 className="text-xl font-semibold mb-3">{t("addURL")}</h3>

        <div id="add-edit-url-form">
          <TextField label={common("name")} value={name} onChange={(value) => setName(value)} />
          <TextField
            placeholder="http://my-host:my-port"
            type="url"
            label={common("url")}
            value={url}
            onChange={(value) => setUrl(value)}
          />

          <Button onPress={handleSubmit} type="submit" size="xs">
            {props.url ? common("save") : t("addURL")}
          </Button>
        </div>

        <Popover.Arrow className="fill-primary" />
      </Popover.Content>
    </Popover.Root>
  );
}
