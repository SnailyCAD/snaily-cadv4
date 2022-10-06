import * as React from "react";
import { usePermission } from "hooks/usePermission";
import { useRouter } from "next/router";
import type { LayoutProps } from "components/Layout";
import { Loader } from "@snailycad/ui";

export function useHasPermissionForLayout(permissions: LayoutProps["permissions"]) {
  const [forbidden, setForbidden] = React.useState(false);

  const { hasPermissions } = usePermission();
  const router = useRouter();

  React.useEffect(() => {
    if (!permissions) return;

    if (!hasPermissions(permissions.permissions, permissions.fallback)) {
      router.push("/403");
      setForbidden(true);
    }
  }, [hasPermissions, router, permissions]);

  return { forbidden, Loader: _Loader };
}

function _Loader() {
  return (
    <div id="unauthorized" className="fixed inset-0 grid bg-transparent place-items-center">
      <span aria-label="loading...">
        <Loader className="w-14 h-14 border-[3px]" />
      </span>
    </div>
  );
}
