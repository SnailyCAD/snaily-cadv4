import * as React from "react";
import { useTranslations } from "use-intl";
import dynamic from "next/dynamic";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { useModal } from "state/modalState";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ModalIds } from "types/ModalIds";
import { Officer, ValueType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { formatOfficerDepartment, formatUnitDivisions, makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useImageUrl } from "hooks/useImageUrl";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { OfficerRank } from "components/leo/OfficerRank";
import { UnitDepartmentStatus } from "components/leo/UnitDepartmentStatus";
import type { DeleteMyOfficerByIdData, GetMyOfficersData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { ImageWrapper } from "components/shared/image-wrapper";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const ManageOfficerModal = dynamic(
  async () => (await import("components/leo/modals/ManageOfficerModal")).ManageOfficerModal,
);

interface Props {
  officers: GetMyOfficersData["officers"];
}

export default function MyOfficers({ officers: data }: Props) {
  useLoadValuesClientSide({
    valueTypes: [ValueType.DEPARTMENT, ValueType.DIVISION],
  });

  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { DIVISIONS, BADGE_NUMBERS } = useFeatureEnabled();
  const tableState = useTableState();

  const [officers, setOfficers] = React.useState<Officer[]>(data);
  const [tempOfficer, officerState] = useTemporaryItem(officers);

  async function handleDeleteOfficer() {
    if (!tempOfficer) return;

    const { json } = await execute<DeleteMyOfficerByIdData>({
      path: `/leo/${tempOfficer.id}`,
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertDeleteOfficer);
      setOfficers((p) => p.filter((v) => v.id !== tempOfficer.id));
      officerState.setTempId(null);
    }
  }

  function handleEditClick(officer: Officer) {
    officerState.setTempId(officer.id);
    openModal(ModalIds.ManageOfficer);
  }

  function handleDeleteClick(officer: Officer) {
    officerState.setTempId(officer.id);
    openModal(ModalIds.AlertDeleteOfficer);
  }

  return (
    <Layout
      permissions={{ fallback: (u) => u.isLeo, permissions: [Permissions.Leo] }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("myOfficers")}</Title>

        <Button onPress={() => openModal(ModalIds.ManageOfficer)}>{t("createOfficer")}</Button>
      </header>

      {officers.length <= 0 ? (
        <p className="mt-5">{t("noOfficers")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={officers.map((officer) => {
            return {
              id: officer.id,
              officer: (
                <span className="flex items-center">
                  {officer.imageId ? (
                    <ImageWrapper
                      quality={70}
                      className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                      draggable={false}
                      src={makeImageUrl("units", officer.imageId)!}
                      loading="lazy"
                      width={30}
                      height={30}
                      alt={makeUnitName(officer)}
                    />
                  ) : null}
                  {makeUnitName(officer)}
                </span>
              ),
              callsign: generateCallsign(officer),
              badgeNumber: officer.badgeNumber,
              department: formatOfficerDepartment(officer) ?? common("none"),
              departmentStatus: <UnitDepartmentStatus unit={officer} />,
              division: formatUnitDivisions(officer),
              rank: <OfficerRank unit={officer} />,
              position: officer.position ?? common("none"),
              actions: (
                <>
                  <Button size="xs" onPress={() => handleEditClick(officer)} variant="success">
                    {common("edit")}
                  </Button>
                  <Button
                    onPress={() => handleDeleteClick(officer)}
                    className="ml-2"
                    variant="danger"
                    size="xs"
                  >
                    {common("delete")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { header: t("officer"), accessorKey: "officer" },
            { header: t("callsign"), accessorKey: "callsign" },
            BADGE_NUMBERS ? { header: t("badgeNumber"), accessorKey: "badgeNumber" } : null,
            { header: t("department"), accessorKey: "department" },
            DIVISIONS ? { header: t("division"), accessorKey: "division" } : null,
            { header: t("rank"), accessorKey: "rank" },
            { header: t("position"), accessorKey: "position" },
            { header: t("status"), accessorKey: "departmentStatus" },
            { header: common("actions"), accessorKey: "actions" },
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
        onClose={() => officerState.setTempId(null)}
      />

      <AlertModal
        title={t("deleteOfficer")}
        description={t.rich("alert_deleteOfficer", {
          officer: tempOfficer && makeUnitName(tempOfficer),
        })}
        id={ModalIds.AlertDeleteOfficer}
        onDeleteClick={handleDeleteOfficer}
        state={state}
        onClose={() => officerState.setTempId(null)}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [{ officers }] = await requestAll(req, [["/leo", { officers: [] }]]);

  return {
    props: {
      session: user,
      officers,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
