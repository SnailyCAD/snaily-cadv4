import { Nav } from "components/nav/Nav";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { AdminSidebar } from "./Sidebar";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: Props) {
  const { Component, roleplayStopped } = useRoleplayStopped();

  return (
    <>
      <Nav />

      <main className={className}>
        <div className="flex">
          <AdminSidebar />

          <div
            style={{ width: "calc(100vw - 330px)" }}
            className="container mx-auto ml-6 px-4 py-5"
          >
            {roleplayStopped ? <Component /> : null}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
