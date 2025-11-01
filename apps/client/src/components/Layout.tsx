import * as React from "react";
import type { Permissions } from "hooks/usePermission";
import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { Nav } from "./shared/nav/Nav";
import { useHasPermissionForLayout } from "hooks/auth/useHasPermissionForLayout";
import { useSocketError } from "hooks/global/useSocketError";
import { useSocket } from "@casperiv/use-socket.io";
import { usePermission } from "hooks/usePermission";
import { Permissions as PermissionsEnum } from "@snailycad/permissions";
import { useLeoState } from "state/leo-state";
import { ShouldDoType } from "@snailycad/types";

import dynamic from "next/dynamic";

const SocketErrorComponent = dynamic(
  async () => (await import("hooks/global/components/socket-error-component")).SocketErrorComponent,
  { ssr: false },
);

const GDOfficerChatbox = dynamic(
  async () => (await import("components/leo/officer-chatbox/GDOfficerChatbox")).GDOfficerChatbox,
  { ssr: false },
);

export interface LayoutProps {
  children: React.ReactNode;
  permissions?: { permissions: Permissions[] };
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
  const { hasPermissions } = usePermission();
  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const hasLeoPermissions = hasPermissions([PermissionsEnum.Leo]);
  const isOfficerOnDuty =
    hasLeoPermissions &&
    activeOfficer !== null &&
    activeOfficer.status !== null &&
    activeOfficer.status.shouldDo !== ShouldDoType.SET_OFF_DUTY;

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
      {isOfficerOnDuty ? <GDOfficerChatbox /> : null}
    </>
  );
}
