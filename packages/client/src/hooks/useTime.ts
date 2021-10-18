import format from "date-fns/format";
import * as React from "react";

export function useTime() {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current) {
        ref.current.textContent = format(new Date(), "HH:mm:ss - yyyy-MM-dd");
      }
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  return ref;
}
