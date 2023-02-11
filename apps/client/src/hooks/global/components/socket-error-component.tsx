import { useTranslations } from "use-intl";

export function SocketErrorComponent() {
  const t = useTranslations("Errors");

  return (
    <div role="alert" className="p-2 px-4 my-2 mb-5 text-black rounded-md shadow bg-red-400">
      <h1 className="text-xl font-bold">{t("socketError")}</h1>
      <p className="mt-1 text-lg">{t("socketErrorInfo")}</p>
    </div>
  );
}
