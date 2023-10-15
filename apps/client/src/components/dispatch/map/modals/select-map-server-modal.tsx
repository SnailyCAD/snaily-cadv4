import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { Alert, Button, SelectField, type SelectValue } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import type { MiscCadSettings } from "@snailycad/types";
import { useDispatchMapState, useSocketStore } from "state/mapState";
import { toastMessage } from "lib/toastMessage";
import { io } from "socket.io-client";

export function SelectMapServerModal() {
  const modalState = useModal();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { cad } = useAuth();
  const liveMapURLs = createLiveMapURLs(cad?.miscCadSettings ?? null);
  const { currentMapServerURL, setCurrentMapServerURL } = useDispatchMapState();
  const { socket, setSocket } = useSocketStore();
  const payload = modalState.getPayload<{ showAlert?: true }>(ModalIds.SelectMapServer);

  function handleClose() {
    modalState.closeModal(ModalIds.SelectMapServer);
  }

  function handleSave(key: string | null) {
    if (!key) return;
    socket?.close();

    setCurrentMapServerURL(key);
    const connection = makeSocketConnection(key);
    if (connection) {
      setSocket(connection);
    }
  }

  return (
    <Modal
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.SelectMapServer)}
      title={t("selectMapServer")}
      className="w-[600px]"
    >
      {payload?.showAlert ? (
        <Alert
          className="mb-5"
          title={t("selectMapServer")}
          type="warning"
          message={t("mustSelectMapServer")}
        />
      ) : null}

      <SelectField
        selectedKey={currentMapServerURL}
        onSelectionChange={(key) => typeof key === "string" && setCurrentMapServerURL(key)}
        label={t("liveMapServer")}
        options={liveMapURLs}
      />

      <footer className="flex mt-5 items-center justify-end">
        <Button
          onPress={() => {
            handleSave(currentMapServerURL);
            handleClose();
          }}
          className="flex items-center"
          type="submit"
        >
          {common("save")}
        </Button>
      </footer>
    </Modal>
  );
}

function createLiveMapURLs(miscCadSettings: MiscCadSettings | null) {
  if (!miscCadSettings) return [];

  const liveMapURLsMap = (miscCadSettings.liveMapURLs ?? []).map(
    (url) => [url.url, { value: url.url, label: url.name }] as [string, SelectValue],
  );
  const liveMapURLs = new Map(liveMapURLsMap);

  if (miscCadSettings.liveMapURL && !liveMapURLs.has(miscCadSettings.liveMapURL)) {
    liveMapURLs.set(miscCadSettings.liveMapURL, {
      label: "Default Server",
      value: miscCadSettings.liveMapURL,
    });

    return Array.from(liveMapURLs.values());
  }

  return Array.from(liveMapURLs.values());
}

export function makeSocketConnection(url: string) {
  try {
    if (url.startsWith("ws")) {
      const _url = url.replace(/ws:\/\//, "http://").replace(/wss:\/\//, "https://");
      return io(_url);
    }

    return io(url);
  } catch (error) {
    const isSecurityError = error instanceof Error && error.name === "SecurityError";

    console.log({ error });

    if (isSecurityError) {
      toastMessage({
        message: `Unable to make a Websocket connection to ${url}. The connections are not secure.`,
        title: "Security Error",
        duration: Infinity,
      });
      return;
    }

    toastMessage({
      message: `Unable to make a Websocket connection to ${url}`,
      title: "Connection Error",
      duration: Infinity,
    });

    return null;
  }
}
