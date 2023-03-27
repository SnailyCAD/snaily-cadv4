import { GetCADSettingsData } from "@snailycad/types/api";
import { getAPIUrl } from "@snailycad/utils/api-url";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import { ExclamationCircleFill } from "react-bootstrap-icons";
import { useTranslations } from "use-intl";

export function ApiVerification() {
  const { execute } = useFetch();
  const t = useTranslations("Errors");
  const apiUrl = getAPIUrl();

  const { error } = useQuery({
    refetchOnWindowFocus: false,
    keepPreviousData: true,
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

  const isNetworkError = error instanceof Error && error.message === "Network Error";
  const title = isNetworkError
    ? "Could not connect the your SnailyCAD API."
    : "Un unexpected error has occurred";
  const message = isNetworkError
    ? t.rich("Network Error", {
        span: (children) => <span className="font-medium">{children}</span>,
        p: (children) => <p className="first:mt-2">{children}</p>,
        clientURL: process.env.NEXT_PUBLIC_CLIENT_URL,
        apiURL: apiUrl,
        currentURL: window.location.href,
      })
    : t("unknown");

  return error ? (
    <div
      role="alert"
      className="w-full max-w-md mb-5 flex flex-col p-2 px-4 text-black rounded-md shadow bg-red-400 border border-red-500/80"
    >
      <header className="flex items-center gap-2 mb-2">
        <ExclamationCircleFill />
        <h5 className="font-semibold text-lg">{title}</h5>
      </header>
      <div className="text-lg">{message}</div>

      <p className="mt-3">
        For more information, please visit our{" "}
        <a
          target="_blank"
          className="font-semibold underline"
          href="https://snailycad.com/docs/troubleshooting"
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
    </div>
  ) : null;
}
