import * as React from "react";
import { Nav } from "components/nav/Nav";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { classNames } from "lib/classNames";
import { AdminSidebar } from "./Sidebar";
import type { LayoutProps } from "components/Layout";
import { usePermission } from "hooks/usePermission";
import { useRouter } from "next/router";

interface Props {
  children: React.ReactNode;
  className?: string;
  permissions: LayoutProps["permissions"];
}

export function AdminLayout({ children, className, permissions }: Props) {
  const [forbidden, setForbidden] = React.useState(false);
  // todo: create hook to remove duplicate code

  const { Component, roleplayStopped } = useRoleplayStopped();
  const { hasPermissions } = usePermission();
  const router = useRouter();

  React.useEffect(() => {
    if (!permissions) return;

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
      <Nav maxWidth="none" />

      <main className={classNames("dark:text-white", className)}>
        <div className="flex">
          <AdminSidebar />

          <div className="ml-6 px-4 py-5 admin-dashboard-responsive">
            {roleplayStopped ? <Component /> : null}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
