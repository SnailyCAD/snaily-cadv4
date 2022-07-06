import { useFormikContext } from "formik";
import * as React from "react";

export function useSessionStorage<T>(key: string) {
  const [value, setValue] = React.useState<T | null>(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem(key) || "null");

      return v;
    } catch (_) {
      console.log(_);
      return null;
    }
  });

  return [value, setValue] as const;
}

export function SaveToSessionStorage<TForm>({
  id,
  setSessionStorage,
}: {
  id: string;
  setSessionStorage: React.Dispatch<React.SetStateAction<TForm | null>>;
}) {
  const { values, submitCount } = useFormikContext<TForm>();
  const isFirstTime = React.useRef(true);

  React.useEffect(() => {
    if (isFirstTime.current) {
      isFirstTime.current = false;
    } else {
      setSessionStorage(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, id]);

  React.useEffect(() => {
    if (submitCount === 1) {
      setSessionStorage(null);
      isFirstTime.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount, id]);

  return null;
}
