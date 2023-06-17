import { usePermission, Permissions } from "hooks/usePermission";
import type { ReactNode } from "react";

interface Props {
  permissions?: Permissions[];
  title: string;
  children: ReactNode;
  icon: ReactNode;
}

export function SidebarSection({ icon, title, permissions, children }: Props) {
  const { hasPermissions } = usePermission();

  if (permissions && !hasPermissions(permissions)) {
    return null;
  }

  return (
    <section className="mt-6 first:mt-0">
      <header className="flex items-center gap-2 px-3">
        <span aria-hidden>{icon}</span>

        <h1 className="text-[20px] font-semibold dark:text-white">{title}</h1>
      </header>

      <ul className="flex flex-col space-y-1.5 mt-3 ml-5">{children}</ul>
    </section>
  );
}
