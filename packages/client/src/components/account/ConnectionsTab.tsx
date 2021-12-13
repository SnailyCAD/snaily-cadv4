import * as React from "react";
import { Tab } from "@headlessui/react";
import { Button } from "components/Button";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "use-intl";
import { findUrl } from "lib/fetch";

export const ConnectionsTab = () => {
  const { user } = useAuth();
  const t = useTranslations("Account");

  function handleConnectClick() {
    const url = findUrl();

    const fullUrl = `${url}/auth/discord`;
    window.location.href = fullUrl;
  }

  return (
    <Tab.Panel>
      <h3 className="text-2xl font-semibold">{t("appearanceSettings")}</h3>
      <div className="mt-5">
        {user?.discordId ? (
          <>
            <Button variant="danger">Disconnect Discord account</Button>
            <p className="mt-2 text-base">This will remove the ability to login via Discord.</p>
          </>
        ) : (
          <>
            <Button onClick={handleConnectClick}>Connect Discord account</Button>
            <p className="mt-2 text-base">This will add the ability to login via Discord.</p>
          </>
        )}
      </div>
    </Tab.Panel>
  );
};
