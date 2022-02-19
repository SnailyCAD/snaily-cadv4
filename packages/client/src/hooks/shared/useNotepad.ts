import { dataToSlate, DEFAULT_EDITOR_DATA } from "components/modal/DescriptionModal/Editor";
import { useRouter } from "next/router";
import * as React from "react";
import type { Descendant } from "slate";

const routeIds: Record<string, string> = {
  "/officer": "snaily-cad-notepad-officer-data",
  "/ems-fd": "snaily-cad-notepad-ems-data-fd",
  "/dispatch": "snaily-cad-notepad-dispatch-data",
  "/tow": "snaily-cad-notepad-tow-data",
  "/taxi": "snaily-cad-notepad-taxi-data",
};

export function useNotepad() {
  const router = useRouter();
  const routeId = routeIds[router.pathname];

  const [value, setValue] = React.useState<Descendant[]>(DEFAULT_EDITOR_DATA);

  React.useEffect(() => {
    if (!routeId) return;

    const localStr = window.localStorage.getItem(routeId);

    const local = dataToSlate({
      description: localStr,
      descriptionData: localStr ? JSON.parse(localStr) : DEFAULT_EDITOR_DATA,
    });
    setValue(local);
  }, [routeId]);

  function setLocal(value: Descendant[]) {
    if (!routeId) return;

    setValue(value);
    window.localStorage.setItem(routeId, JSON.stringify(value));
  }

  return [value, setLocal] as const;
}
