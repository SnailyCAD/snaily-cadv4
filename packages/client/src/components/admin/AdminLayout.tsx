import { Nav } from "components/nav/Nav";
import { useRoleplayStopped } from "hooks/useRoleplayStopped";
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

      <main className={`mt-5 px-4 pb-5 container max-w-[100rem] mx-auto ${className}`}>
        <div className="flex">
          <AdminSidebar />

          <div className="w-full ml-4">
            {roleplayStopped ? <Component /> : null}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
