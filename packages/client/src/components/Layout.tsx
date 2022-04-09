import * as React from "react";
import type { Permissions, PermissionsFallback } from "hooks/usePermission";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { Nav } from "./nav/Nav";
import { useHasPermissionForLayout } from "hooks/auth/useHasPermissionForLayout";

export interface LayoutProps {
  children: React.ReactNode;
  permissions?: { fallback: PermissionsFallback; permissions: Permissions[] };
  className?: string;
  hideAlerts?: boolean;
  navMaxWidth?: string;
}

export function Layout({
  hideAlerts,
  navMaxWidth,
  children,
  className = "",
  permissions,
}: LayoutProps) {
  const { Component, audio, roleplayStopped } = useRoleplayStopped();
  const { forbidden, Loader } = useHasPermissionForLayout(permissions);

  if (forbidden) {
    return <Loader />;
  }

  return (
    <>
      <Nav maxWidth={navMaxWidth} />

      <main className={`mt-5 px-4 pb-5 container max-w-[100rem] mx-auto ${className}`}>
        {roleplayStopped && !hideAlerts ? <Component audio={audio} /> : null}

        {children}
      </main>
    </>
  );
}
