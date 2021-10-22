import * as React from "react";
import { useTranslations } from "use-intl";
import Head from "next/head";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { useModal } from "context/ModalContext";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { ModalIds } from "types/ModalIds";
import { DivisionValue, EmsFdDeputy, Value } from "types/prisma";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { FullOfficer } from "state/dispatchState";
import { ManageDeputyModal } from "components/ems-fd/modals/ManageDeputyModal";

export type DeputyWithDept = EmsFdDeputy & {
  division: DivisionValue;
  department: Value<"DEPARTMENT">;
};

interface Props {
  deputies: FullOfficer[];
}

export default function MyDeputies({ deputies: data }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();

  const [deputies, setDeputies] = React.useState(data ?? []);
  const [tempDeputy, setTempDeputy] = React.useState<FullOfficer | null>(null);

  async function handleDeleteOfficer() {
    if (!tempDeputy) return;

    const { json } = await execute(`/ems-fd/${tempDeputy.id}`, { method: "DELETE" });

    if (json) {
      closeModal(ModalIds.AlertDeleteDeputy);
      setDeputies((p) => p.filter((v) => v.id !== tempDeputy.id));
    }
  }

  function handleEditClick(officer: FullOfficer) {
    setTempDeputy(officer);
    openModal(ModalIds.ManageDeputy);
  }

  function handleDeleteClick(officer: FullOfficer) {
    setTempDeputy(officer);
    openModal(ModalIds.AlertDeleteDeputy);
  }

  return (
    <Layout>
      <Head>
        <title>{t("Ems.myDeputies")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("Ems.myDeputies")}</h1>

        <Button onClick={() => openModal(ModalIds.ManageDeputy)}>{t("Ems.createDeputy")}</Button>
      </header>

      {deputies.length <= 0 ? (
        <p className="mt-5">{t("Ems.noDeputies")}</p>
      ) : (
        <div className="overflow-x-auto w-full mt-3">
          <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
            <thead>
              <tr>
                <th>{t("Ems.deputy")}</th>
                <th>{t("Leo.callsign")}</th>
                <th>{t("Leo.badgeNumber")}</th>
                <th>{t("Leo.department")}</th>
                <th>{t("Leo.division")}</th>
                <th>{common("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {deputies.map((officer) => (
                <tr key={officer.id}>
                  <td>{officer.name}</td>
                  <td>{officer.callsign}</td>
                  <td>{String(officer.badgeNumber)}</td>
                  <td>{officer.department.value}</td>
                  <td>{officer.division?.value?.value}</td>
                  <td className="w-36">
                    <Button small onClick={() => handleEditClick(officer)} variant="success">
                      {common("edit")}
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(officer)}
                      className="ml-2"
                      variant="danger"
                      small
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

      <ManageDeputyModal
        onCreate={(officer) => setDeputies((p) => [officer, ...p])}
        onUpdate={(old, newO) => {
          setDeputies((p) => {
            const idx = p.indexOf(old);
            p[idx] = newO;

            return p;
          });
        }}
        deputy={tempDeputy}
        onClose={() => setTimeout(() => setTempDeputy(null), 100)}
      />

      <AlertModal
        title={t("Ems.deleteDeputy")}
        description={t.rich("Ems.alert_deleteDeputy", {
          span: (children) => <span className="font-semibold">{children}</span>,
          deputy: tempDeputy && tempDeputy.name,
        })}
        id={ModalIds.AlertDeleteDeputy}
        onDeleteClick={handleDeleteOfficer}
        state={state}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const { data: deputies } = await handleRequest("/ems-fd", {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

  const { data: values } = await handleRequest("/admin/values/department?paths=division").catch(
    () => ({
      data: [],
    }),
  );

  return {
    props: {
      session: await getSessionUser(req.headers),
      deputies,
      values,
      messages: {
        ...(await getTranslations(["ems-fd", "leo", "common"], locale)),
      },
    },
  };
};
