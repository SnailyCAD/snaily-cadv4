import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { X } from "react-bootstrap-icons";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";

export function useSignal100() {
  const { cad } = useAuth();
  const [hidden, setHidden] = React.useState(false);
  const [signal100Enabled, setSign100] = React.useState<boolean>(
    cad?.miscCadSettings?.signal100Enabled ?? false,
  );

  useListener(SocketEvents.Signal100, (value: boolean) => {
    setSign100(value ?? false);
  });

  React.useEffect(() => {
    setSign100(cad?.miscCadSettings.signal100Enabled ?? false);
    setHidden(false);
  }, [cad?.miscCadSettings.signal100Enabled]);

  return { signal100Enabled, hidden, setHidden, Component };
}

const Component = ({ setHidden }: { setHidden: any }) => {
  const t = useTranslations("Leo");

  return (
    <div
      role="alert"
      className="font-semibold text-white bg-red-500 p-2 px-3 rounded-md my-2 flex items-center justify-between"
    >
      <p>{t("signal100enabled")}</p>
      <Button
        aria-label="Hide"
        className="p-1 px-1.5 bg-red-600 hover:bg-red-700"
        onClick={() => setHidden(true)}
      >
        <X width={25} height={25} />
      </Button>
    </div>
  );
};
