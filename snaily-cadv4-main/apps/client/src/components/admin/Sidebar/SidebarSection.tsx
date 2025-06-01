import { usePermission, type Permissions } from "hooks/usePermission";
import { classNames } from "lib/classNames";
import type { ReactNode } from "react";

interface Props {
  permissions?: Permissions[];
  title: string;
  children: ReactNode;
  icon: ReactNode;
  marginTop?: "mt-6" | "mt-4";
}

export function SidebarSection({ icon, title, marginTop, permissions, children }: Props) {
  const { hasPermissions } = usePermission();

  if (permissions && !hasPermissions(permissions)) {
    return null;
  }

  return (
    <section className={classNames("first:mt-0 w-full", marginTop === "mt-4" ? "mt-4" : "mt-6")}>
      <header className="flex items-center gap-2 px-3">
        <span aria-hidden>{icon}</span>

        <h1 className="text-[20px] font-semibold dark:text-white">{title}</h1>
      </header>

      <ul className="flex flex-col space-y-1.5 mt-3 ml-5">{children}</ul>
    </section>
  );
}
