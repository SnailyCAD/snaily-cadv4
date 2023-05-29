import { GetCADSettingsData } from "@snailycad/types/api";
import { Alert } from "@snailycad/ui";
import { getAPIUrl } from "@snailycad/utils/api-url";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
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
    <Alert type="error" title={title} message={message}>
      <p className="mt-3">
        For more information, please visit our{" "}
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
