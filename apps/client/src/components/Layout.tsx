import * as React from "react";
import type { Permissions, PermissionsFallback } from "hooks/usePermission";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { Nav } from "./nav/Nav";
import { useHasPermissionForLayout } from "hooks/auth/useHasPermissionForLayout";
import { useSocketError } from "hooks/global/useSocketError";
import { useSocket } from "@casper124578/use-socket.io";

import dynamic from "next/dynamic";

const SocketErrorComponent = dynamic(
  async () => (await import("hooks/global/components/socket-error-component")).SocketErrorComponent,
  { ssr: false },
);

export interface LayoutProps {
  children: React.ReactNode;
  permissions?: { fallback?: PermissionsFallback; permissions: Permissions[] };
  className?: string;
  hideAlerts?: boolean;
  navMaxWidth?: string;
}

let connectedToSocket = false;

export function Layout({
  hideAlerts,
  navMaxWidth,
  children,
  className = "",
  permissions,
}: LayoutProps) {
  const { Component, audio, roleplayStopped } = useRoleplayStopped();
  const { showError } = useSocketError();
  const { forbidden, Loader } = useHasPermissionForLayout(permissions);
  const socket = useSocket();

  React.useEffect(() => {
    if (connectedToSocket) return;

    connectedToSocket = true;

    if (!socket?.connected) {
      socket?.connect();
    }
  }, [socket?.connected]); // eslint-disable-line

  if (forbidden) {
    return <Loader />;
  }

  return (
    <>
      <Nav maxWidth={navMaxWidth} />

      <main className={`mt-5 px-4 md:px-6 pb-5 container max-w-[100rem] mx-auto ${className}`}>
        <Component enabled={roleplayStopped && !hideAlerts} audio={audio} />
        {showError ? <SocketErrorComponent /> : null}

        {children}
      </main>
    </>
  );
}
