import * as React from "react";
import { TabsContent } from "components/shared/TabList";
import * as Accordion from "@radix-ui/react-accordion";
import { FormField } from "components/form/FormField";
import { Toggle } from "components/form/Toggle";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { StatusViewMode, TableActionsAlignment } from "@snailycad/types";
import { Select } from "components/form/Select";
import { Button, Loader, SelectField } from "@snailycad/ui";
import nextConfig from "../../../next.config";
import type { Sounds } from "lib/server/getAvailableSounds.server";
import { soundCamelCaseToKebabCase } from "lib/utils";
import { CaretDownFill } from "react-bootstrap-icons";
import { useRouter } from "next/router";
import type { PatchUserData } from "@snailycad/types/api";
import { useAudio } from "react-use";

interface Props {
  availableSounds: Record<Sounds, boolean>;
}

export function AppearanceTab({ availableSounds }: Props) {
  const { user, setUser } = useAuth();
  const t = useTranslations("Account");
  const { execute, state } = useFetch();
  const common = useTranslations("Common");
  const availableLanguages = nextConfig.i18n?.locales;
  const router = useRouter();
  const [currentSrc, setCurrentSrc] = React.useState("");

  const [audio, , controls] = useAudio({
    src: currentSrc,
    autoPlay: false,
  });

  const STATUS_VIEW_MODE_LABELS = {
    [StatusViewMode.DOT_COLOR]: t("dotColor"),
    [StatusViewMode.FULL_ROW_COLOR]: t("fullRowColor"),
  };

  const TABLE_ALIGNMENT_LABELS = {
    [TableActionsAlignment.NONE]: common("none"),
    [TableActionsAlignment.LEFT]: common("left"),
    [TableActionsAlignment.RIGHT]: common("right"),
  };

  if (!user) {
    return null;
  }

  const INITIAL_VALUES = {
    isDarkTheme: user.isDarkTheme ?? true,
    statusViewMode: user.statusViewMode ?? StatusViewMode.DOT_COLOR,
    tableActionsAlignment: user.tableActionsAlignment,
    locale: user?.locale ?? nextConfig.i18n?.defaultLocale,
    soundSettings: {
      panicButton: user.soundSettings?.panicButton ?? true,
      signal100: user.soundSettings?.signal100 ?? true,
      addedToCall: user.soundSettings?.addedToCall ?? false,
      stopRoleplay: user.soundSettings?.stopRoleplay ?? false,
      statusUpdate: user.soundSettings?.statusUpdate ?? false,
      incomingCall: user.soundSettings?.incomingCall ?? false,
      speech: user.soundSettings?.speech ?? true,
    },
  };
  const sounds = Object.keys(INITIAL_VALUES.soundSettings);

  async function onSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute<PatchUserData, typeof INITIAL_VALUES>({
      path: "/user",
      method: "PATCH",
      data: { username: user?.username, ...data },
    });

    if (data.locale !== user?.locale) {
      return router.reload();
    }

    if (json.id) {
      setUser({ ...user, ...json });
    }
  }

  const availableSoundsArr = sounds.filter((v) => availableSounds[soundCamelCaseToKebabCase(v)]);
  const unAvailableSoundsArr = sounds.filter(
    (v) => v !== "speech" && !availableSounds[soundCamelCaseToKebabCase(v)],
  );

  return (
    <TabsContent aria-label={t("appearanceSettings")} value="appearanceSettings">
      {audio}

      <h1 className="text-2xl font-semibold">{t("appearanceSettings")}</h1>
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, values, errors }) => (
          <Form className="mt-3">
            <FormField checkbox errorMessage={errors.isDarkTheme} label={t("darkTheme")}>
              <Toggle
                value={values.isDarkTheme}
                onCheckedChange={handleChange}
                name="isDarkTheme"
              />
            </FormField>

            <FormField errorMessage={errors.locale} label={t("locale")}>
              <Select
                values={availableLanguages.map((v) => ({ value: v, label: v }))}
                value={values.locale}
                onChange={handleChange}
                name="locale"
              />
            </FormField>

            <SelectField
              errorMessage={errors.statusViewMode}
              label={t("statusView")}
              options={Object.values(StatusViewMode).map((v) => ({
                value: v,
                label: STATUS_VIEW_MODE_LABELS[v],
              }))}
              selectedKey={values.statusViewMode}
              onSelectionChange={(value) => setFieldValue("statusViewMode", value)}
              name="statusViewMode"
            />

            <SelectField
              errorMessage={errors.tableActionsAlignment}
              label={t("tableAlignment")}
              options={Object.values(TableActionsAlignment).map((v) => ({
                value: v,
                label: TABLE_ALIGNMENT_LABELS[v],
              }))}
              selectedKey={values.tableActionsAlignment}
              onSelectionChange={(value) => setFieldValue("tableActionsAlignment", value)}
              name="tableActionsAlignment"
            />

            <div className="mb-5">
              <h2 className="text-2xl font-semibold mb-3">{t("sounds")}</h2>

              <div className="mb-3">
                <FormField className="!mb-0" label="Speech" checkbox>
                  <Toggle
                    value={values.soundSettings.speech}
                    onCheckedChange={handleChange}
                    name="soundSettings.speech"
                  />
                </FormField>
              </div>

              {availableSoundsArr.map((_name) => {
                const fieldName = _name as keyof typeof INITIAL_VALUES.soundSettings;
                const kebabCase = soundCamelCaseToKebabCase(fieldName);
                const soundAvailable = !!availableSounds[kebabCase];

                if (!soundAvailable) return null;
                if (fieldName === "speech") return null;

                return (
                  <div className="mb-3 flex flex-row gap-5" key={fieldName}>
                    <FormField className="!mb-0" label={t(fieldName)} checkbox>
                      <Toggle
                        value={values.soundSettings[fieldName]}
                        onCheckedChange={handleChange}
                        name={`soundSettings.${fieldName}`}
                        disabled={!soundAvailable}
                      />
                    </FormField>

                    <Button
                      size="xs"
                      type="button"
                      onPress={() => {
                        setCurrentSrc(`/sounds/${kebabCase}.mp3`);
                        controls.volume(0.1);
                        controls.play();
                      }}
                    >
                      Test sound (Double Click)
                    </Button>
                  </div>
                );
              })}

              {unAvailableSoundsArr.length <= 0 ? null : (
                <Accordion.Root className="mt-4" type="multiple">
                  <Accordion.Item value="unavailable-sounds">
                    <Accordion.Trigger
                      title="Click to expand"
                      className="accordion-state gap-2 flex items-center justify-between pt-1 text-lg font-semibold text-left"
                    >
                      <p>Unavailable Sounds</p>

                      <CaretDownFill
                        width={16}
                        height={16}
                        className="transform w-4 h-4 transition-transform accordion-state-transform"
                      />
                    </Accordion.Trigger>

                    <Accordion.Content className="mt-3">
                      {unAvailableSoundsArr.map((sound) => (
                        <p key={sound}>{t(sound)}</p>
                      ))}

                      <p className="mt-2">
                        These sounds are unavailable.
                        <a
                          className="ml-1 underline"
                          rel="noreferrer"
                          target="_blank"
                          href="https://cad-docs.caspertheghost.me/docs/guides/how-set-custom-sounds"
                        >
                          They must be added by an admin.
                        </a>
                      </p>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              )}
            </div>

            <Button
              className="flex items-center gap-2"
              type="submit"
              disabled={state === "loading"}
            >
              {state === "loading" ? <Loader /> : null}
              {common("save")}
            </Button>
          </Form>
        )}
      </Formik>
    </TabsContent>
  );
}
