import * as React from "react";
import { useTranslations } from "use-intl";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { useModal } from "context/ModalContext";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { ModalIds } from "types/ModalIds";
import { DivisionValue, EmsFdDeputy, Value } from "types/prisma";
import useFetch from "lib/useFetch";
import { FullOfficer } from "state/dispatchState";
import { makeImageUrl, requestAll } from "lib/utils";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const ManageDeputyModal = dynamic(
  async () => (await import("components/ems-fd/modals/ManageDeputyModal")).ManageDeputyModal,
);

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
              {deputies.map((deputy) => (
                <tr key={deputy.id}>
                  <td className="capitalize flex items-center">
                    {deputy.imageId ? (
                      <img
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("units", deputy.imageId)}
                      />
                    ) : null}
                    {deputy.name}
                  </td>
                  <td>{deputy.callsign}</td>
                  <td>{String(deputy.badgeNumber)}</td>
                  <td>{deputy.department.value}</td>
                  <td>{deputy.division?.value?.value}</td>
                  <td className="w-36">
                    <Button small onClick={() => handleEditClick(deputy)} variant="success">
                      {common("edit")}
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(deputy)}
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
        onClose={() => setTempDeputy(null)}
      />

      <AlertModal
        title={t("Ems.deleteDeputy")}
        description={t.rich("Ems.alert_deleteDeputy", {
          span: (children) => <span className="font-semibold">{children}</span>,
          deputy: tempDeputy && tempDeputy.name,
        })}
        id={ModalIds.AlertDeleteDeputy}
        onDeleteClick={handleDeleteOfficer}
        onClose={() => setTempDeputy(null)}
        state={state}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [{ deputies }, values] = await requestAll(req, [
    ["/ems-fd", { deputies: [] }],
    ["/admin/values/department?paths=division", []],
  ]);

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
