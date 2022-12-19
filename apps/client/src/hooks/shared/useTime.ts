import * as React from "react";
import format from "date-fns/format";
import { useMounted } from "@casper124578/useful";

export function useTime() {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isMounted = useMounted();

  React.useEffect(() => {
    function setTime() {
      if (ref.current && isMounted) {
        ref.current.textContent = format(new Date(), "HH:mm:ss - yyyy-MM-dd");
      }
    }

    setTime();
    const interval = setInterval(setTime);

    return () => {
      clearInterval(interval);
    };
  }, [isMounted]);

  return ref;
}
