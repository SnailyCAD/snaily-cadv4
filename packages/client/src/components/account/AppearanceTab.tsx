import { TabsContent } from "components/shared/TabList";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Toggle } from "components/form/Toggle";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { StatusViewMode, TableActionsAlignment } from "@snailycad/types";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import type { Sounds } from "lib/server/getAvailableSounds";
import { soundCamelCaseToKebabCase } from "lib/utils";

interface Props {
  availableSounds: Record<Sounds, boolean>;
}

export function AppearanceTab({ availableSounds }: Props) {
  const { user, setUser } = useAuth();
  const t = useTranslations("Account");
  const { execute, state } = useFetch();
  const common = useTranslations("Common");

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
    soundSettings: user.soundSettings ?? {
      panicButton: true,
      signal100: true,
      addedToCall: false,
      stopRoleplay: false,
      statusUpdate: false,
      incomingCall: false,
    },
  };
  const sounds = Object.keys(INITIAL_VALUES.soundSettings);

  async function onSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute("/user", {
      method: "PATCH",
      data: { username: user?.username, ...data },
    });

    if (json.id) {
      setUser({ ...user, ...json });
    }
  }

  return (
    <TabsContent aria-label={t("appearanceSettings")} value="appearanceSettings">
      <h3 className="text-2xl font-semibold">{t("appearanceSettings")}</h3>
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form className="mt-3">
            <FormField checkbox errorMessage={errors.isDarkTheme} label={t("darkTheme")}>
              <Toggle toggled={values.isDarkTheme} onClick={handleChange} name="isDarkTheme" />
            </FormField>

            <FormField errorMessage={errors.statusViewMode} label={t("statusView")}>
              <Select
                values={Object.values(StatusViewMode).map((v) => ({
                  value: v,
                  label: STATUS_VIEW_MODE_LABELS[v],
                }))}
                value={values.statusViewMode}
                onChange={handleChange}
                name="statusViewMode"
              />
            </FormField>

            <FormField errorMessage={errors.tableActionsAlignment} label={t("tableAlignment")}>
              <Select
                values={Object.values(TableActionsAlignment).map((v) => ({
                  value: v,
                  label: TABLE_ALIGNMENT_LABELS[v],
                }))}
                value={values.tableActionsAlignment}
                onChange={handleChange}
                name="tableActionsAlignment"
              />
            </FormField>

            <div className="mb-5">
              <h3 className="text-2xl font-semibold mb-3">{t("sounds")}</h3>

              {sounds.map((_name) => {
                const fieldName = _name as keyof typeof INITIAL_VALUES.soundSettings;
                const kebabCase = soundCamelCaseToKebabCase(fieldName);
                const soundEnabled = !!availableSounds[kebabCase];

                return (
                  <div className="mb-3" key={fieldName}>
                    <FormField className="!mb-0" label={t(fieldName)} checkbox>
                      <Toggle
                        toggled={values.soundSettings[fieldName]}
                        onClick={handleChange}
                        name={`soundSettings.${fieldName}`}
                        disabled={!soundEnabled}
                      />
                    </FormField>
                    {!soundEnabled ? (
                      <p className="text-base">
                        This sound is unavailable.
                        <a
                          className="ml-1 underline"
                          rel="noreferrer"
                          target="_blank"
                          href="https://cad-docs.caspertheghost.me/docs/guides/how-set-custom-sounds"
                        >
                          This sound must be added by an admin
                        </a>
                      </p>
                    ) : null}
                  </div>
                );
              })}
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
