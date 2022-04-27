import * as React from "react";
import type { Permissions, PermissionsFallback } from "hooks/usePermission";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { Nav } from "./nav/Nav";
import { useHasPermissionForLayout } from "hooks/auth/useHasPermissionForLayout";
import { useSocketError } from "hooks/global/useSocketError";

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
  const { SocketErrorComponent, showError } = useSocketError();
  const { forbidden, Loader } = useHasPermissionForLayout(permissions);

  if (forbidden) {
    return <Loader />;
  }

  return (
    <>
      <Nav maxWidth={navMaxWidth} />

      <main className={`mt-5 px-4 pb-5 container max-w-[100rem] mx-auto ${className}`}>
        <Component enabled={roleplayStopped && !hideAlerts} audio={audio} />
        {showError ? <SocketErrorComponent /> : null}

        {children}
      </main>
    </>
  );
}
