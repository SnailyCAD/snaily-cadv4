import { Layout } from "components/Layout";
import { useRoleplayStopped } from "hooks/useRoleplayStopped";
import { classNames } from "lib/classNames";
import { AdminSidebar } from "./Sidebar";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: Props) {
  const { Component, roleplayStopped } = useRoleplayStopped();

  return (
    <Layout hideAlerts className={classNames("relative z-10 flex", className)}>
      <div className="w-60">
        <AdminSidebar />
      </div>

      <div className="w-full ml-4">
        {roleplayStopped ? <Component /> : null}
        {children}
      </div>
    </Layout>
  );
}
