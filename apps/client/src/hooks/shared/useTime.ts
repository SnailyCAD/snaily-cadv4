import * as React from "react";
import format from "date-fns/format";

export function useTime() {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    function setTime() {
      if (ref.current) {
        ref.current.textContent = format(new Date(), "PPpp");
      }
    }

    setTime();
    const interval = setInterval(setTime);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return ref;
}
