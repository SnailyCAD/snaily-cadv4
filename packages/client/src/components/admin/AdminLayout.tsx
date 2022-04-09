import * as React from "react";
import { Nav } from "components/nav/Nav";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { classNames } from "lib/classNames";
import { AdminSidebar } from "./Sidebar";
import type { LayoutProps } from "components/Layout";
import { useHasPermissionForLayout } from "hooks/auth/useHasPermissionForLayout";

interface Props {
  children: React.ReactNode;
  className?: string;
  permissions?: LayoutProps["permissions"];
}

export function AdminLayout({ children, className, permissions }: Props) {
  const { Component, audio, roleplayStopped } = useRoleplayStopped();
  const { forbidden, Loader } = useHasPermissionForLayout(permissions);

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
            {roleplayStopped ? <Component audio={audio} /> : null}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
