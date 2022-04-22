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
import { Officer, WhitelistStatus } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { formatOfficerDepartment, formatUnitDivisions, makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useImageUrl } from "hooks/useImageUrl";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { HoverCard } from "components/shared/HoverCard";
import { Info } from "react-bootstrap-icons";
import { Status } from "components/shared/Status";
import { Permissions } from "@snailycad/permissions";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const ManageOfficerModal = dynamic(
  async () => (await import("components/leo/modals/ManageOfficerModal")).ManageOfficerModal,
);

interface Props {
  officers: Officer[];
}

export default function MyOfficers({ officers: data }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { BADGE_NUMBERS } = useFeatureEnabled();

  const [officers, setOfficers] = React.useState(data);
  const [tempOfficer, setTempOfficer] = React.useState<Officer | null>(null);

  async function handleDeleteOfficer() {
    if (!tempOfficer) return;

    const { json } = await execute(`/leo/${tempOfficer.id}`, { method: "DELETE" });

    if (json) {
      closeModal(ModalIds.AlertDeleteOfficer);
      setOfficers((p) => p.filter((v) => v.id !== tempOfficer.id));
      setTempOfficer(null);
    }
  }

  function handleEditClick(officer: Officer) {
    setTempOfficer(officer);
    openModal(ModalIds.ManageOfficer);
  }

  function handleDeleteClick(officer: Officer) {
    setTempOfficer(officer);
    openModal(ModalIds.AlertDeleteOfficer);
  }

  return (
    <Layout
      permissions={{ fallback: (u) => u.isLeo, permissions: [Permissions.Leo] }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("myOfficers")}</Title>

        <Button onClick={() => openModal(ModalIds.ManageOfficer)}>{t("createOfficer")}</Button>
      </header>

      {officers.length <= 0 ? (
        <p className="mt-5">{t("noOfficers")}</p>
      ) : (
        <Table
          data={officers.map((officer) => {
            const departmentStatus = officer.whitelistStatus?.status ?? null;
            const departmentStatusFormatted = departmentStatus
              ? departmentStatus.toLowerCase()
              : "—";

            return {
              officer: (
                <span className="flex items-center">
                  {officer.imageId ? (
                    <img
                      className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                      draggable={false}
                      src={makeImageUrl("units", officer.imageId)}
                    />
                  ) : null}
                  {makeUnitName(officer)}
                </span>
              ),
              callsign: generateCallsign(officer),
              badgeNumber: officer.badgeNumber,
              department: formatOfficerDepartment(officer) ?? common("none"),
              departmentStatus: (
                <span className="capitalize flex items-center gap-2">
                  <Status state={departmentStatus}>{departmentStatusFormatted}</Status>

                  {officer.whitelistStatus?.status === WhitelistStatus.PENDING ? (
                    <HoverCard
                      trigger={
                        <Button className="px-1 cursor-default">
                          <Info />
                        </Button>
                      }
                    >
                      <p className="max-w-[400px]">
                        {t.rich(
                          officer.department?.isDefaultDepartment
                            ? "pendingAccessDepartment"
                            : "pendingAccessDepartmentNoDefault",
                          {
                            defaultDepartment: officer.department?.value.value,
                          },
                        )}
                      </p>
                    </HoverCard>
                  ) : null}
                </span>
              ),
              division: formatUnitDivisions(officer),
              rank: officer.rank?.value ?? common("none"),
              actions: (
                <>
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
                </>
              ),
            };
          })}
          columns={[
            { Header: t("officer"), accessor: "officer" },
            { Header: t("callsign"), accessor: "callsign" },
            BADGE_NUMBERS ? { Header: t("badgeNumber"), accessor: "badgeNumber" } : null,
            { Header: t("department"), accessor: "department" },
            { Header: t("division"), accessor: "division" },
            { Header: t("rank"), accessor: "rank" },
            { Header: t("status"), accessor: "departmentStatus" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <ManageOfficerModal
        onCreate={(officer) => setOfficers((p) => [officer, ...p])}
        onUpdate={(old, newO) => {
          setOfficers((p) => {
            const idx = p.indexOf(old);
            p[idx] = newO;

            return p;
          });
        }}
        officer={tempOfficer}
        onClose={() => setTempOfficer(null)}
      />

      <AlertModal
        title={t("deleteOfficer")}
        description={t.rich("alert_deleteOfficer", {
          span: (children) => <span className="font-semibold">{children}</span>,
          officer: tempOfficer && makeUnitName(tempOfficer),
        })}
        id={ModalIds.AlertDeleteOfficer}
        onDeleteClick={handleDeleteOfficer}
        state={state}
        onClose={() => setTempOfficer(null)}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [citizens, { officers }, values] = await requestAll(req, [
    ["/citizen", []],
    ["/leo", { officers: [] }],
    ["/admin/values/department?paths=division", []],
  ]);

  return {
    props: {
      session: await getSessionUser(req),
      officers,
      citizens,
      values,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
