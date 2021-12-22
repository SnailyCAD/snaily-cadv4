import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";

export function useRoleplayStopped() {
  const { cad } = useAuth();

  const [roleplayStopped, setRoleplay] = React.useState<boolean>(false);

  useListener(SocketEvents.RoleplayStopped, (value: boolean) => {
    setRoleplay(!value ?? false);
  });

  React.useEffect(() => {
    if (cad?.miscCadSettings) {
      setRoleplay(!cad?.miscCadSettings?.roleplayEnabled ?? false);
    }
  }, [cad?.miscCadSettings]);

  return { roleplayStopped, Component };
}

const Component = () => {
  const t = useTranslations("Common");

  return (
    <div role="alert" className="p-2 px-4 my-2 mb-5 text-black rounded-md shadow bg-amber-500">
      <h1 className="text-xl font-bold">{t("stopRoleplay")}</h1>
      <p className="mt-1 text-lg">{t("roleplayStopped")}</p>
    </div>
  );
};
