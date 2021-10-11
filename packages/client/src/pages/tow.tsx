import * as React from "react";
import Head from "next/head";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { Citizen, TowCall } from "types/prisma";
import { handleRequest } from "lib/fetch";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";
import { useListener } from "context/SocketContext";
import { SocketEvents } from "@snailycad/config";

type FullTowCall = TowCall & { assignedUnit: Citizen | null; creator: Citizen };

interface Props {
  calls: FullTowCall[];
}

export default function Tow(props: Props) {
  const [calls, setCalls] = React.useState<FullTowCall[]>(props.calls);
  const common = useTranslations("Common");
  const t = useTranslations("Tow");

  useListener(SocketEvents.CreateTowCall, (data) => {
    setCalls((p) => [...p, data.data]);
  });

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
        <title>{"Tow"} - SnailyCAD</title>
      </Head>

      <h1 className="text-3xl font-semibold">{"Tow"}</h1>

      {calls.length <= 0 ? (
        <p className="mt-5">{"There are no tow calls yet."}</p>
      ) : (
        <div className="overflow-x-auto w-full mt-3">
          <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
            <thead>
              <tr>
                <th>{t("location")}</th>
                <th>{common("description")}</th>
                <th>{t("caller")}</th>
                <th>{t("assignedUnit")}</th>
                <th>{common("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id}>
                  <td>{call.location}</td>
                  <td>{call.description}</td>
                  <td className="capitalize">
                    {call.creator.name} {call.creator.surname}
                  </td>
                  <td>{assignedUnit(call)}</td>
                  <td className="w-[30%]">
                    <Button
                      //  onClick={() => handleEditClick(vehicle)}
                      small
                      variant="success"
                    >
                      {common("edit")}
                    </Button>
                    <Button
                      className="ml-2"
                      // onClick={() => handleDeleteClick(vehicle)}
                      small
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  </td>
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
  const { data } = await handleRequest("/tow", {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

  return {
    props: {
      calls: data,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["tow", "common"], locale)),
      },
    },
  };
};
