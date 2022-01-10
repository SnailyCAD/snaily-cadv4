import { useRoleplayStopped } from "hooks/global/useRoleplayStopped";
import { Nav } from "./nav/Nav";

interface Props {
  children: React.ReactNode;
  className?: string;
  hideAlerts?: boolean;
}

export function Layout({ hideAlerts, children, className = "" }: Props) {
  const { Component, roleplayStopped } = useRoleplayStopped();

  return (
    <>
      <Nav />

      <main className={`mt-5 px-4 pb-5 container max-w-[100rem] mx-auto ${className}`}>
        {roleplayStopped && !hideAlerts ? <Component /> : null}

        {children}
      </main>
    </>
  );
}
