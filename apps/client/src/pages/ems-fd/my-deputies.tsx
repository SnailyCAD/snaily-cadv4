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
import useFetch from "lib/useFetch";
import { formatOfficerDepartment, makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useImageUrl } from "hooks/useImageUrl";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { OfficerRank } from "components/leo/OfficerRank";
import { UnitDepartmentStatus } from "components/leo/UnitDepartmentStatus";
import type { DeleteMyDeputyByIdData, GetMyDeputiesData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { ImageWrapper } from "components/shared/image-wrapper";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const ManageDeputyModal = dynamic(
  async () => (await import("components/ems-fd/modals/ManageDeputyModal")).ManageDeputyModal,
);

interface Props {
  deputies: GetMyDeputiesData["deputies"];
}

export default function MyDeputies({ deputies: data }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { DIVISIONS, BADGE_NUMBERS } = useFeatureEnabled();
  const tableState = useTableState();

  const [deputies, setDeputies] = React.useState(data);
  const [tempDeputy, deputyState] = useTemporaryItem(deputies);

  async function handleDeleteDeputy() {
    if (!tempDeputy) return;

    const { json } = await execute<DeleteMyDeputyByIdData>({
      path: `/ems-fd/${tempDeputy.id}`,
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertDeleteDeputy);
      setDeputies((p) => p.filter((v) => v.id !== tempDeputy.id));
    }
  }

  function handleEditClick(deputy: GetMyDeputiesData["deputies"][number]) {
    deputyState.setTempId(deputy.id);
    openModal(ModalIds.ManageDeputy);
  }

  function handleDeleteClick(deputy: GetMyDeputiesData["deputies"][number]) {
    deputyState.setTempId(deputy.id);
    openModal(ModalIds.AlertDeleteDeputy);
  }

  return (
    <Layout
      permissions={{ fallback: (u) => u.isEmsFd, permissions: [Permissions.EmsFd] }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("Ems.myDeputies")}</Title>

        <Button onPress={() => openModal(ModalIds.ManageDeputy)}>{t("Ems.createDeputy")}</Button>
      </header>

      {deputies.length <= 0 ? (
        <p className="mt-5">{t("Ems.noDeputies")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={deputies.map((deputy) => ({
            id: deputy.id,
            deputy: (
              <span className="flex items-center">
                {deputy.imageId ? (
                  <ImageWrapper
                    quality={70}
                    className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                    draggable={false}
                    src={makeImageUrl("units", deputy.imageId)!}
                    loading="lazy"
                    width={30}
                    height={30}
                    alt={makeUnitName(deputy)}
                  />
                ) : null}
                {makeUnitName(deputy)}
              </span>
            ),
            callsign: generateCallsign(deputy),
            badgeNumber: deputy.badgeNumber,
            department: formatOfficerDepartment(deputy) ?? common("none"),
            departmentStatus: <UnitDepartmentStatus unit={deputy} />,
            division: deputy.division?.value.value ?? common("none"),
            rank: <OfficerRank unit={deputy} />,
            position: deputy.position ?? common("none"),
            actions: (
              <>
                <Button size="xs" onPress={() => handleEditClick(deputy)} variant="success">
                  {common("edit")}
                </Button>
                <Button
                  onPress={() => handleDeleteClick(deputy)}
                  className="ml-2"
                  variant="danger"
                  size="xs"
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: t("Ems.deputy"), accessorKey: "deputy" },
            { header: t("Leo.callsign"), accessorKey: "callsign" },
            BADGE_NUMBERS ? { header: t("Leo.badgeNumber"), accessorKey: "badgeNumber" } : null,
            { header: t("Leo.department"), accessorKey: "department" },
            DIVISIONS ? { header: t("Leo.division"), accessorKey: "division" } : null,
            { header: t("Leo.rank"), accessorKey: "rank" },
            { header: t("Leo.position"), accessorKey: "position" },
            { header: t("Leo.status"), accessorKey: "departmentStatus" },
            { header: common("actions"), accessorKey: "actions" },
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
        onClose={() => deputyState.setTempId(null)}
      />

      <AlertModal
        title={t("Ems.deleteDeputy")}
        description={t.rich("Ems.alert_deleteDeputy", {
          deputy: tempDeputy && makeUnitName(tempDeputy),
        })}
        id={ModalIds.AlertDeleteDeputy}
        onDeleteClick={handleDeleteDeputy}
        onClose={() => deputyState.setTempId(null)}
        state={state}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [{ deputies }, values] = await requestAll(req, [
    ["/ems-fd", { deputies: [] }],
    ["/admin/values/department?paths=division", []],
  ]);

  return {
    props: {
      session: user,
      deputies,
      values,
      messages: {
        ...(await getTranslations(["ems-fd", "leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
