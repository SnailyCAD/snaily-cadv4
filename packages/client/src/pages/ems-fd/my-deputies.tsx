import * as React from "react";
import { useTranslations } from "use-intl";
import dynamic from "next/dynamic";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { useModal } from "state/modalState";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ModalIds } from "types/ModalIds";
import useFetch from "lib/useFetch";
import { formatOfficerDepartment, makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useImageUrl } from "hooks/useImageUrl";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import type { EmsFdDeputy } from "@snailycad/types";
import { Permissions } from "@snailycad/permissions";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { OfficerRank } from "components/leo/OfficerRank";
import { UnitDepartmentStatus } from "components/leo/UnitDepartmentStatus";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const ManageDeputyModal = dynamic(
  async () => (await import("components/ems-fd/modals/ManageDeputyModal")).ManageDeputyModal,
);

interface Props {
  deputies: EmsFdDeputy[];
}

export default function MyDeputies({ deputies: data }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { BADGE_NUMBERS } = useFeatureEnabled();

  const [deputies, setDeputies] = React.useState(data);
  const [tempDeputy, setTempDeputy] = React.useState<EmsFdDeputy | null>(null);

  async function handleDeleteOfficer() {
    if (!tempDeputy) return;

    const { json } = await execute(`/ems-fd/${tempDeputy.id}`, { method: "DELETE" });

    if (json) {
      closeModal(ModalIds.AlertDeleteDeputy);
      setDeputies((p) => p.filter((v) => v.id !== tempDeputy.id));
    }
  }

  function handleEditClick(deputy: EmsFdDeputy) {
    setTempDeputy(deputy);
    openModal(ModalIds.ManageDeputy);
  }

  function handleDeleteClick(deputy: EmsFdDeputy) {
    setTempDeputy(deputy);
    openModal(ModalIds.AlertDeleteDeputy);
  }

  return (
    <Layout
      permissions={{ fallback: (u) => u.isEmsFd, permissions: [Permissions.EmsFd] }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("Ems.myDeputies")}</Title>

        <Button onClick={() => openModal(ModalIds.ManageDeputy)}>{t("Ems.createDeputy")}</Button>
      </header>

      {deputies.length <= 0 ? (
        <p className="mt-5">{t("Ems.noDeputies")}</p>
      ) : (
        <Table
          data={deputies.map((deputy) => ({
            deputy: (
              <span className="flex items-center">
                {deputy.imageId ? (
                  <img
                    className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                    draggable={false}
                    src={makeImageUrl("units", deputy.imageId)}
                  />
                ) : null}
                {makeUnitName(deputy)}
              </span>
            ),
            callsign: generateCallsign(deputy),
            badgeNumber: deputy.badgeNumber,
            department: formatOfficerDepartment(deputy) ?? common("none"),
            departmentStatus: <UnitDepartmentStatus unit={deputy} />,
            division: deputy.division.value.value,
            rank: <OfficerRank unit={deputy} />,
            position: deputy.position ?? common("none"),
            actions: (
              <>
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
              </>
            ),
          }))}
          columns={[
            { Header: t("Ems.deputy"), accessor: "deputy" },
            { Header: t("Leo.callsign"), accessor: "callsign" },
            BADGE_NUMBERS ? { Header: t("Leo.badgeNumber"), accessor: "badgeNumber" } : null,
            { Header: t("Leo.department"), accessor: "department" },
            { Header: t("Leo.division"), accessor: "division" },
            { Header: t("Leo.rank"), accessor: "rank" },
            { Header: t("Leo.position"), accessor: "position" },
            { Header: t("Leo.status"), accessor: "departmentStatus" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <ManageDeputyModal
        onCreate={(deputy) => setDeputies((p) => [deputy, ...p])}
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
          deputy: tempDeputy && makeUnitName(tempDeputy),
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
  const user = await getSessionUser(req);
  const [{ deputies }, citizens, values] = await requestAll(req, [
    ["/ems-fd", { deputies: [] }],
    ["/citizen", []],
    ["/admin/values/department?paths=division", []],
  ]);

  return {
    props: {
      session: user,
      deputies,
      values,
      citizens,
      messages: {
        ...(await getTranslations(["ems-fd", "leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
