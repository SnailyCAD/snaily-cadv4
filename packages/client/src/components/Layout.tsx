import * as React from "react";
import { usePermission, Permissions, PermissionsFallback } from "hooks/usePermission";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { Nav } from "./nav/Nav";
import { useRouter } from "next/router";

export interface LayoutProps {
  children: React.ReactNode;
  permissions: { fallback: PermissionsFallback; permissions: Permissions[] };
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
  const [forbidden, setForbidden] = React.useState(false);

  const { Component, roleplayStopped } = useRoleplayStopped();
  const { hasPermissions } = usePermission();
  const router = useRouter();

  React.useEffect(() => {
    if (!hasPermissions(permissions.permissions, permissions.fallback)) {
      router.push("/403");
      setForbidden(true);
    }
  }, [hasPermissions, router, permissions]);

  if (forbidden) {
    return null;
  }

  return (
    <>
      <Nav maxWidth={navMaxWidth} />

      <main className={`mt-5 px-4 pb-5 container max-w-[100rem] mx-auto ${className}`}>
        {roleplayStopped && !hideAlerts ? <Component /> : null}

        {children}
      </main>
    </>
  );
}
