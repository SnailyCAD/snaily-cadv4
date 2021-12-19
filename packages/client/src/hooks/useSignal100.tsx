import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useTranslations } from "use-intl";

export function useSignal100() {
  const { cad } = useAuth();
  const [signal100Enabled, setSign100] = React.useState<boolean>(
    cad?.miscCadSettings?.signal100Enabled ?? false,
  );

  useListener(SocketEvents.Signal100, (value: boolean) => {
    setSign100(value ?? false);
  });

  React.useEffect(() => {
    setSign100(cad?.miscCadSettings?.signal100Enabled ?? false);
  }, [cad?.miscCadSettings?.signal100Enabled]);

  return { signal100Enabled, Component };
}

const Component = () => {
  const t = useTranslations("Leo");

  return (
    <div role="alert" className="p-2 px-3 my-2 font-semibold text-white bg-red-500 rounded-md">
      <p>{t("signal100enabled")}</p>
    </div>
  );
};
