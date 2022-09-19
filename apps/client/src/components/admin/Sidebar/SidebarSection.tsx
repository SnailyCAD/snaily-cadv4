import { usePermission, Permissions } from "hooks/usePermission";
import type { ReactNode } from "react";

interface Props {
  permissions?: Permissions[];
  title: string;
  children: ReactNode;
}

export function SidebarSection({ title, permissions, children }: Props) {
  const { hasPermissions } = usePermission();

  if (permissions && !hasPermissions(permissions, true)) {
    return null;
  }

  return (
    <section className="mt-3 first:mt-0">
      <h1 className="px-3 text-2xl font-semibold dark:text-white">{title}</h1>
      <ul className="flex flex-col space-y-1.5 mt-3">{children}</ul>
    </section>
  );
}
