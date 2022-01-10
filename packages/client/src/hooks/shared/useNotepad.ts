import { useRouter } from "next/router";
import * as React from "react";

const routeIds: Record<string, string> = {
  "/officer": "snaily-cad-notepad-officer",
  "/ems-fd": "snaily-cad-notepad-ems-fd",
  "/dispatch": "snaily-cad-notepad-dispatch",
  "/tow": "snaily-cad-notepad-tow",
  "/taxi": "snaily-cad-notepad-taxi",
};

export function useNotepad() {
  const router = useRouter();
  const routeId = routeIds[router.pathname];

  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (!routeId) return;
    const local = window.localStorage.getItem(routeId);

    if (local) {
      setValue(local);
    }
  }, [routeId]);

  function setLocal(value: string) {
    if (!routeId) return;

    setValue(value);
    window.localStorage.setItem(routeId, value);
  }

  return [value, setLocal] as const;
}
