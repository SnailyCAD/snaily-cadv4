import { Nav } from "components/shared/nav/Nav";
import { SidebarSection } from "../Sidebar/SidebarSection";
import * as Tabs from "@radix-ui/react-tabs";
import { Title } from "components/shared/Title";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { ArrowLeft } from "react-bootstrap-icons";
import { parseCadVersion } from "../AdminLayout";
import { useSocketError } from "hooks/global/useSocketError";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { useAuth } from "context/AuthContext";
import { SocketErrorComponent } from "hooks/global/components/socket-error-component";
import { Alert } from "@snailycad/ui";

export enum SettingsTabs {
  GeneralSettings = "GENERAL_SETTINGS",
  WhitelistSettings = "WHITELIST_SETTINGS",
  Features = "FEATURES",
  BlacklistedWords = "BLACKLISTED_WORDS",

  /** misc */
  InactivityTimeouts = "INACTIVITY_TIMEOUTS",
  CitizenLicensePoints = "CITIZEN_LICENSE_POINTS",
  MaxLicensePoints = "MAX_LICENSE_POINTS",
  Templates = "TEMPLATES",
  Other = "OTHER",
  Limits = "LIMITS",

  /** integrations */
  LiveMap = "LIVE_MAP",
  APIToken = "API_TOKEN",

  /** permissions */
  DefaultPermissions = "DEFAULT_PERMISSIONS",
  DiscordRoles = "DISCORD_ROLES",

  /** webhooks */
  DiscordWebhooks = "DISCORD_WEBHOOKS",
  RawWebhooks = "RAW_WEBHOOKS",
}

export function CadSettingsLayout(props: { children: React.ReactNode }) {
  const t = useTranslations("Management");
  const { Component, audio, roleplayStopped } = useRoleplayStopped();
  const { showError } = useSocketError();
  const { cad } = useAuth();
  const tError = useTranslations("Errors");

  const isNewVersionAvailable =
    cad?.version?.latestReleaseVersion &&
    parseCadVersion(cad.version.latestReleaseVersion) > parseCadVersion(cad.version.currentVersion);

  return (
    <>
      <Nav maxWidth="none" />

      <main className="text-white">
        <Tabs.Root defaultValue={SettingsTabs.GeneralSettings} className="flex">
          <Title renderLayoutTitle={false}>{t("MANAGE_CAD_SETTINGS")}</Title>

          <CadSettingsSidebar />

          <div className="ml-6 px-4 py-5 admin-dashboard-responsive">
            <Component enabled={roleplayStopped} audio={audio} />
            {showError ? <SocketErrorComponent /> : null}
            {cad?.version && isNewVersionAvailable ? (
              <a
                href={`https://github.com/SnailyCAD/snaily-cadv4/releases/tag/${cad.version.latestReleaseVersion}`}
                className="block mb-5"
              >
                <Alert
                  type="warning"
                  title={tError("updateAvailable")}
                  message={tError("updateAvailableInfo")}
                />
              </a>
            ) : null}
            {props.children}
          </div>
        </Tabs.Root>
      </main>
    </>
  );
}

function CadSettingsSidebar() {
  const t = useTranslations("Management");

  const SIDEBAR_ITEMS = [
    {
      name: t("general"),
      items: [
        SettingsTabs.GeneralSettings,
        SettingsTabs.WhitelistSettings,
        SettingsTabs.Features,
        SettingsTabs.BlacklistedWords,
      ],
    },
    {
      name: t("miscellaneous"),
      items: [
        SettingsTabs.InactivityTimeouts,
        SettingsTabs.CitizenLicensePoints,
        SettingsTabs.MaxLicensePoints,
        SettingsTabs.Templates,
        SettingsTabs.Limits,
        SettingsTabs.Other,
      ],
    },
    {
      name: t("permissions"),
      items: [SettingsTabs.DiscordRoles, SettingsTabs.DefaultPermissions],
    },
    {
      name: t("integrations"),
      items: [SettingsTabs.LiveMap, SettingsTabs.APIToken],
    },
    {
      name: t("webhooks"),
      items: [SettingsTabs.DiscordWebhooks, SettingsTabs.RawWebhooks],
    },
  ];

  return (
    <Tabs.List>
      <aside
        style={{ height: "calc(100vh - 3.5rem)" }}
        className="top-14 pt-5 pb-3 pr-4 bg-gray-100 dark:bg-tertiary flex flex-col overflow-x-hidden overflow-y-auto transition-[width] duration-100 thin-scrollbar sticky w-14 nav:w-72 justify-end nav:justify-start items-center nav:items-start"
      >
        <header className="px-4 mb-3">
          <h1 className="text-xl mb-2 font-semibold dark:text-white">{t("MANAGE_CAD_SETTINGS")}</h1>

          <Link className="flex items-center gap-1 underline" href="/admin">
            <ArrowLeft /> Back to Admin
          </Link>
        </header>

        {SIDEBAR_ITEMS.map((category) => {
          return (
            <SidebarSection marginTop="mt-4" icon={null} title={category.name} key={category.name}>
              {category.items.map((key) => (
                <Tabs.Trigger asChild value={key} key={key}>
                  <li className="w-full cursor-pointer flex items-center justify-between transition-colors rounded-md px-3 py-1 dark:text-white hover:bg-gray-200 dark:hover:bg-secondary data-[state=active]:bg-secondary">
                    {t(key)}
                  </li>
                </Tabs.Trigger>
              ))}
            </SidebarSection>
          );
        })}
      </aside>
    </Tabs.List>
  );
}
