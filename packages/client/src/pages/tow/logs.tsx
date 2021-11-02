import * as React from "react";
import Head from "next/head";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { requestAll } from "lib/utils";
import { FullTowCall } from ".";

interface Props {
  calls: FullTowCall[];
}

export default function TowLogs(props: Props) {
  const [calls, setCalls] = React.useState<FullTowCall[]>(props.calls);
  const common = useTranslations("Common");
  const t = useTranslations("Calls");

  useListener(SocketEvents.EndTowCall, handleCallEnd);

  function handleCallEnd(call: FullTowCall) {
    setCalls((p) => [call, ...p]);
  }

  const assignedUnit = (call: FullTowCall) =>
    call.assignedUnit ? (
      <span>
        {call.assignedUnit.name} {call.assignedUnit.surname}
      </span>
    ) : (
      <span>{common("none")}</span>
    );

  React.useEffect(() => {
    setCalls(props.calls);
  }, [props.calls]);

  return (
    <Layout>
      <Head>
        <title>{t("towLogs")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-semibold">{t("towLogs")}</h1>
      </header>

      {calls.length <= 0 ? (
        <p className="mt-5">{t("noTowCalls")}</p>
      ) : (
        <div className="overflow-x-auto w-full mt-3">
          <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
            <thead>
              <tr>
                <th>{t("location")}</th>
                <th>{common("description")}</th>
                <th>{t("caller")}</th>
                <th>{t("assignedUnit")}</th>
                {/* <th>{common("actions")}</th> */}
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id}>
                  <td>{call.location}</td>
                  <td>{call.description}</td>
                  <td className="capitalize">
                    {call.creator ? `${call.creator.name} ${call.creator.surname}` : "Dispatch"}
                  </td>
                  <td className="capitalize">{assignedUnit(call)}</td>
                  {/* <td className="w-36">
                    <Button className="ml-2" onClick={() => assignClick(call)} small>
                      {common("details")}
                    </Button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data] = await requestAll(req, [["/tow?ended=true", []]]);

  return {
    props: {
      calls: data,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["calls", "common"], locale)),
      },
    },
  };
};
