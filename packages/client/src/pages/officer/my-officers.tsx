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
import { DivisionValue, Officer, Value } from "types/prisma";
import { ManageOfficerModal } from "components/leo/modals/ManageOfficerModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

export type OfficerWithDept = Officer & {
  division: DivisionValue;
  department: Value<"DEPARTMENT">;
};

interface Props {
  officers: OfficerWithDept[];
}

export default function MyOfficers({ officers: data }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();

  const [officers, setOfficers] = React.useState(data ?? []);
  const [tempOfficer, setTempOfficer] = React.useState<OfficerWithDept | null>(null);

  async function handleDeleteOfficer() {
    if (!tempOfficer) return;

    const { json } = await execute(`/leo/${tempOfficer.id}`, { method: "DELETE" });

    if (json) {
      closeModal(ModalIds.AlertDeleteOfficer);
      setOfficers((p) => p.filter((v) => v.id !== tempOfficer.id));
    }
  }

  function handleEditClick(officer: OfficerWithDept) {
    setTempOfficer(officer);
    openModal(ModalIds.ManageOfficer);
  }

  function handleDeleteClick(officer: OfficerWithDept) {
    setTempOfficer(officer);
    openModal(ModalIds.AlertDeleteOfficer);
  }

  return (
    <Layout>
      <Head>
        <title>{t("myOfficers")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("myOfficers")}</h1>

        <Button onClick={() => openModal(ModalIds.ManageOfficer)}>{t("createOfficer")}</Button>
      </header>

      {officers.length <= 0 ? (
        <p className="mt-5">{t("noOfficers")}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {officers.map((officer) => (
            <li
              key={officer.id}
              className="p-4 rounded-md bg-gray-200 flex items-start justify-between"
            >
              <div>
                <p>
                  <span className="font-semibold">{t("officer")}: </span> {officer.name}
                </p>
                <p>
                  <span className="font-semibold">{t("callsign")}: </span> {officer.callsign}
                </p>
                <p>
                  <span className="font-semibold">{t("department")}: </span>
                  {officer.department.value}
                </p>
                <p>
                  <span className="font-semibold">{t("division")}: </span>
                  {officer.division?.value?.value}
                </p>
              </div>

              <div>
                <Button onClick={() => handleEditClick(officer)} variant="success">
                  {common("edit")}
                </Button>
                <Button
                  onClick={() => handleDeleteClick(officer)}
                  className="ml-2"
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ManageOfficerModal
        onCreate={(officer) => setOfficers((p) => [officer, ...p])}
        officer={tempOfficer}
      />

      <AlertModal
        title={t("deleteOfficer")}
        description={t.rich("alert_deleteOfficer", {
          span: (children) => <span className="font-semibold">{children}</span>,
          officer: tempOfficer && tempOfficer.name,
        })}
        id={ModalIds.AlertDeleteOfficer}
        onDeleteClick={handleDeleteOfficer}
        state={state}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const { data: officers } = await handleRequest("/leo", {
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
      officers,
      values,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
