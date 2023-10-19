import type { GetCADSettingsData } from "@snailycad/types/api";
import { Alert } from "@snailycad/ui";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import { ExclamationDiamondFill, QuestionCircleFill } from "react-bootstrap-icons";
import { useTranslations } from "use-intl";

interface Props {
  isCORSError: boolean;
  CORS_ORIGIN_URL: string | null;
}

export function ApiVerification(props: Props) {
  const { execute } = useFetch();
  const t = useTranslations("Errors");

  const { error } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ["api-verification"],
    retry: 0,
    queryFn: async () => {
      const { json, error } = await execute<GetCADSettingsData>({
        path: "/admin/manage/cad-settings",
        noToast: true,
        timeout: 5_000,
      });

      if (error) {
        throw new Error(error);
      }

      return json;
    },
  });

  if (error && props.isCORSError) {
    return (
      <div className="fixed inset-0 grid place-content-center z-[999] text-white bg-primary">
        <div className="p-2 max-w-2xl">
          <h1 className="flex items-center gap-2 font-bold text-2xl mb-3">
            <ExclamationDiamondFill className="fill-red-400" />
            Incorrect Configuration Detected (CORS)
          </h1>

          <p className="font-medium leading-relaxed">
            We have detected an incorrect URL in your <code>.env</code> file or ENV in the
            SnailyCAD. This means you will not be able to use SnailyCADv4 unless you resolve this
            issue.
            <span className="my-2 block" />
            SnailyCADv4 is designed to communicate to an API, which is hosted on a different URL.
            Browsers have a strict security policy (<code>CORS</code>) which requires this strict
            configuration for SnailyCAD.
          </p>

          <section className="mt-4">
            <h3 className="text-xl font-semibold mb-1">Your Configuration</h3>
            <p className="font-medium">
              The configuration that you have provided in your <code>.env</code> file or ENV in the
              SnailyCAD Manager App:
            </p>

            <ul className="leading-loose mt-1">
              <pre className="bg-secondary rounded-md p-2 mt-3">
                {`CORS_ORIGIN_URL="${props.CORS_ORIGIN_URL}"
NEXT_PUBLIC_CLIENT_URL="${process.env.NEXT_PUBLIC_CLIENT_URL}"
NEXT_PUBLIC_PROD_ORIGIN="${process.env.NEXT_PUBLIC_PROD_ORIGIN}"`}
              </pre>
            </ul>
          </section>

          <section className="mt-4">
            <h3 className="text-xl font-semibold mb-1">Accessing URL</h3>
            <p className="font-medium flex gap-2 items-center">
              The URL you are correct using to access SnailyCAD:
            </p>

            <pre suppressHydrationWarning className="bg-secondary rounded-md p-2 mt-3">
              {typeof window === "undefined"
                ? "-"
                : `${window.location.protocol}//${window.location.host}`}
            </pre>
          </section>

          <section className="mt-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold mb-1">
              <QuestionCircleFill className="fill-blue-400" />
              How to resolve
            </h3>
            <p className="font-medium leading-relaxed">
              After you have read the above that explains why this happens and what the issue
              exactly is, you can resolve this issue by, making sure that the{" "}
              <code>CORS_ORIGIN_URL</code> in your <code>.env</code> file or ENV in the SnailyCAD
              Manager App matches the URL you are using to access SnailyCAD.
              <span className="my-2 block" />
              If that is the case, this is most likely a different issue.{" "}
              <span className="font-medium">
                If you are the owner/developer for this community,
              </span>{" "}
              please visit our{" "}
              <a
                target="_blank"
                className="font-semibold underline"
                href="https://docs.snailycad.org/docs/guides/troubleshooting"
                rel="noreferrer"
              >
                troubleshooting guide
              </a>{" "}
              or join our{" "}
              <a
                target="_blank"
                className="font-semibold underline"
                href="https://discord.gg/eGnrPqEH7U"
                rel="noreferrer"
              >
                Discord Support Server
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    );
  }

  const isNetworkError = error instanceof Error && error.message === "Network Error";

  if (isNetworkError) {
    return (
      <div className="fixed inset-0 grid place-content-center z-[999] text-white bg-primary">
        <div className="p-2 max-w-2xl">
          <h1 className="flex items-center gap-2 font-bold text-2xl mb-3">
            <ExclamationDiamondFill className="fill-red-400" />
            Could not connect to your SnailyCAD API.
          </h1>

          <p className="font-medium leading-relaxed">
            SnailyCAD was not able to connect to your SnailyCAD API. This means you will not be able
            to use SnailyCADv4 unless you resolve this issue.
            <span className="my-2 block" />
            SnailyCADv4 is designed to communicate to an API, which is hosted on a different URL. We
            have detected issues that block the communication of this system.
          </p>

          <section className="mt-4">
            <h3 className="text-xl font-semibold mb-1">Your Configuration</h3>
            <p className="font-medium">
              The configuration that you have provided in your <code>.env</code> file or ENV in the
              SnailyCAD Manager App:
            </p>

            <ul className="leading-loose mt-1">
              <pre className="bg-secondary rounded-md p-2 mt-3">
                {`CORS_ORIGIN_URL="${props.CORS_ORIGIN_URL}"
NEXT_PUBLIC_CLIENT_URL="${process.env.NEXT_PUBLIC_CLIENT_URL}"
NEXT_PUBLIC_PROD_ORIGIN="${process.env.NEXT_PUBLIC_PROD_ORIGIN}"`}
              </pre>
            </ul>
          </section>

          <section className="mt-4">
            <h3 className="text-xl font-semibold mb-1">Accessing URL</h3>
            <p className="font-medium flex gap-2 items-center">
              The URL you are correct using to access SnailyCAD:
            </p>

            <pre suppressHydrationWarning className="bg-secondary rounded-md p-2 mt-3">
              {typeof window === "undefined"
                ? "-"
                : `${window.location.protocol}//${window.location.host}`}
            </pre>
          </section>

          <section className="mt-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold mb-1">
              <QuestionCircleFill className="fill-blue-400" />
              How to resolve
            </h3>
            <p className="font-medium leading-relaxed">
              After you have read the above, which explains why this issue happens and what it is,
              you can resolve it by making sure of the following:
              <ul className="list-disc pl-6 leading-loose">
                <li>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline"
                    href={process.env.NEXT_PUBLIC_PROD_ORIGIN}
                  >
                    Your SnailyCAD API is accessible.
                  </a>{" "}
                  (It should show your SnailyCAD version)
                </li>

                <li>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://docs.snailycad.org/docs/installations/methods/standalone#6-accessing-snailycadv4"
                    className="text-blue-400 underline"
                  >
                    All the required ports are forwarded.
                  </a>
                </li>
                <li>
                  Your SnailyCAD API URL ends with <code>/v1</code>.
                </li>
              </ul>
              <span className="my-2 block" />
              If you have tried all of the above, it may be a different issue.{" "}
              <span className="font-medium">
                If you are the owner/developer off this community,
              </span>{" "}
              please visit our{" "}
              <a
                target="_blank"
                className="font-semibold underline"
                href="https://docs.snailycad.org/docs/guides/troubleshooting"
                rel="noreferrer"
              >
                troubleshooting guide
              </a>{" "}
              or join our{" "}
              <a
                target="_blank"
                className="font-semibold underline"
                href="https://discord.gg/eGnrPqEH7U"
                rel="noreferrer"
              >
                Discord Support Server
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    );
  }

  return error ? (
    <Alert className="mb-5 max-w-md z-50" type="error" title={t("unknown")}>
      {error instanceof Error ? (
        <pre className="bg-red-500 overflow-x-auto p-4 rounded">{error.stack}</pre>
      ) : null}

      <p className="mt-3">
        <span className="font-medium">If you are the owner/developer for this community,</span>{" "}
        please visit our{" "}
        <a
          target="_blank"
          className="font-semibold underline"
          href="https://docs.snailycad.org/docs/guides/troubleshooting"
          rel="noreferrer"
        >
          troubleshooting guide
        </a>{" "}
        or join our{" "}
        <a
          target="_blank"
          className="font-semibold underline"
          href="https://discord.gg/eGnrPqEH7U"
          rel="noreferrer"
        >
          Discord Support Server
        </a>
        .
      </p>
    </Alert>
  ) : null;
}
