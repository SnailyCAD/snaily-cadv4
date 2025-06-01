import * as React from "react";
import { useMounted } from "@casperiv/useful";
import { useFormatter, useTimeZone } from "use-intl";

export function useTime() {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isMounted = useMounted();
  const { dateTime } = useFormatter();
  const timeZone = useTimeZone();

  React.useEffect(() => {
    function setTime() {
      if (ref.current && isMounted) {
        const time = dateTime(Date.now(), {
          timeZone,
          dateStyle: "medium",
          timeStyle: "medium",
        });

        ref.current.textContent = `${time} ${timeZone ? `(${timeZone})` : ""}`;
      }
    }

    setTime();
    const interval = setInterval(setTime, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [isMounted, timeZone]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}
