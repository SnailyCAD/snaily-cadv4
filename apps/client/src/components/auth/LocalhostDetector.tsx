import * as React from "react";
import { useLocation } from "react-use";

export function LocalhostDetector() {
  const location = useLocation();
  const [isLocalhost, setIsLocalhost] = React.useState<boolean | undefined>(false);

  React.useEffect(() => {
    const isDevelopmentMode = process.env.NODE_ENV === "development";
    const isHostLocalhost =
      location.hostname === "localhost" || location.host?.includes("localhost");
    const isUsingLocalhost = !isDevelopmentMode && isHostLocalhost;

    setIsLocalhost(isUsingLocalhost);
  }, [location]);

  if (!isLocalhost) {
    return null;
  }

  return (
    <div className="p-2 mb-5 -mt-3 font-semibold bg-amber-500 rounded-md max-w-md">
      <span className="text-bold mr-1">WARNING:</span>
      <span>
        the usage of localhost with SnailyCADv4 will not work.{" "}
        <a className="underline" href="https://docs.snailycad.org/docs/errors/localhost-usage">
          Please read more here
        </a>
      </span>
    </div>
  );
}
