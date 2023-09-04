import * as React from "react";
import { CheckCircleFill, ExclamationDiamondFill } from "react-bootstrap-icons";
import { useLocation } from "react-use";

interface Props {
  isLocalhost: boolean;
}

export function LocalhostDetector(props: Props) {
  const location = useLocation();
  const [isLocalhost, setIsLocalhost] = React.useState<boolean | undefined>(props.isLocalhost);

  React.useEffect(() => {
    const isDevelopmentMode = process.env.NODE_ENV === "development";
    const isLocalHost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    const isLocalHostname =
      location.host?.includes("localhost") || location.host?.includes("127.0.0.1");

    const isHostLocalhost = isLocalHost || isLocalHostname;
    const isUsingLocalhost = !isDevelopmentMode && isHostLocalhost;

    setIsLocalhost(isUsingLocalhost);
  }, [location]);

  if (!isLocalhost) {
    return null;
  }

  return (
    <div className="fixed inset-0 grid place-content-center z-[999] text-white bg-primary">
      <div className="p-2 max-w-2xl">
        <h1 className="flex items-center gap-2 font-bold text-2xl mb-3">
          <ExclamationDiamondFill className="fill-red-400" />
          Localhost is not supported
        </h1>

        <p className="font-medium leading-relaxed">
          We have detected the usage of <code>localhost</code> or <code>127.0.0.1</code> in
          production mode. We do not support this and you will not be able to use SnailyCADv4 using
          localhost.
          <br />
          Please update your <code>.env</code> file or ENV in the SnailyCAD Manager App to use a
          valid domain or IP-address.
        </p>

        <section className="mt-4">
          <h3 className="text-xl font-semibold mb-1">Valid Examples</h3>
          <p className="font-medium flex gap-2 items-center">
            <CheckCircleFill className="fill-green-400" />
            The following URLs are supported by SnailyCAD:
          </p>

          <ul className="leading-loose mt-1">
            <li>
              <code>https://cad.example.com</code> - subdomain
            </li>
            <li>
              <code>https://mycad.com</code> - Top level domain
            </li>
            <li>
              <code>http://192.168.0.190:3000</code> -{" "}
              <abbr title="Local Area Network (Home Network)">LAN</abbr> IP-address
            </li>
            <li>
              <code>http://83.39.20.30:3000</code> -{" "}
              <abbr title="Wide Area Network (Public Network)">WAN</abbr> IP-address
            </li>
          </ul>
        </section>

        <section className="mt-4">
          <h3 className="text-xl font-semibold mb-1">Usage</h3>
          <p className="font-medium flex gap-2 items-center">
            A usage based example in the <code>.env</code> file/ENV.
          </p>

          <pre className="bg-secondary rounded-md p-2 mt-3">
            {`CORS_ORIGIN_URL="https://cad.example.com"
NEXT_PUBLIC_CLIENT_URL="https://cad.example.com"`}
          </pre>
        </section>
      </div>
    </div>
  );
}
