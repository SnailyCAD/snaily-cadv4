import type * as React from "react";
import { Nav } from "components/nav/Nav";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { classNames } from "lib/classNames";
import { AdminSidebar } from "./Sidebar";
import type { LayoutProps } from "components/Layout";
import { useHasPermissionForLayout } from "hooks/auth/useHasPermissionForLayout";
import { useSocketError } from "hooks/global/useSocketError";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";

import dynamic from "next/dynamic";

const SocketErrorComponent = dynamic(
  async () => (await import("hooks/global/components/socket-error-component")).SocketErrorComponent,
  { ssr: false },
);

interface Props {
  children: React.ReactNode;
  className?: string;
  permissions?: LayoutProps["permissions"];
}

export function AdminLayout({ children, className, permissions }: Props) {
  const { Component, audio, roleplayStopped } = useRoleplayStopped();
  const { showError } = useSocketError();
  const { forbidden, Loader } = useHasPermissionForLayout(permissions);
  const { cad } = useAuth();
  const t = useTranslations("Errors");

  if (forbidden) {
    return <Loader />;
  }

  return (
    <>
      <Nav maxWidth="none" />

      <main className={classNames("dark:text-white", className)}>
        <div className="flex">
          <AdminSidebar />

          <div className="ml-6 px-4 py-5 admin-dashboard-responsive">
            <Component enabled={roleplayStopped} audio={audio} />
            {showError ? <SocketErrorComponent /> : null}
            {cad?.version?.latestReleaseVersion &&
            cad.version.latestReleaseVersion !== cad.version.currentVersion ? (
              <a
                href={`https://github.com/SnailyCAD/snaily-cadv4/releases/tag/${cad.version.latestReleaseVersion}`}
                role="alert"
                className="block p-2 px-4 my-2 mb-5 text-black rounded-md shadow bg-amber-500"
              >
                <h1 className="text-xl font-bold">{t("updateAvailable")}</h1>
                <p className="mt-1 text-lg">{t("updateAvailableInfo")}</p>
              </a>
            ) : null}

            {children}
          </div>
        </div>
      </main>
    </>
  );
}
