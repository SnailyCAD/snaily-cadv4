import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { LicenseExam, LicenseExamStatus } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { Permissions } from "@snailycad/permissions";
import { Status } from "components/shared/Status";
import { ManageExamModal } from "components/leo/exams/ManageExamModal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { usePermission } from "hooks/usePermission";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import type { GetLicenseExamsData, DeleteLicenseExamByIdData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { SearchArea } from "components/shared/search/search-area";

interface Props {
  data: GetLicenseExamsData;
}

export default function CitizenLogs({ data }: Props) {
  const [search, setSearch] = React.useState("");
  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();

  const asyncTable = useAsyncTable({
    search,
    fetchOptions: {
      onResponse: (json: GetLicenseExamsData) => ({
        data: json.exams,
        totalCount: json.totalCount,
      }),
      path: "/leo/license-exams",
    },
    totalCount: data.totalCount,
    initialData: data.exams,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempExam, examState] = useTemporaryItem(asyncTable.items);
  const hasManagePermissions = hasPermissions(
    [Permissions.ManageLicenseExams],
    (u) => u.isSupervisor,
  );

  const PASS_FAIL_LABELS = {
    PASSED: t("Vehicles.passed"),
    FAILED: t("Vehicles.failed"),
    IN_PROGRESS: t("Vehicles.inProgress"),
  };

  async function handleDelete() {
    if (!tempExam) return;
    const { json } = await execute<DeleteLicenseExamByIdData>({
      path: `/leo/license-exams/${tempExam.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      closeModal(ModalIds.AlertDeleteExam);

      asyncTable.remove(tempExam.id);
      examState.setTempId(null);
    }
  }

  function handleDeleteClick(exam: LicenseExam) {
    examState.setTempId(exam.id);
    openModal(ModalIds.AlertDeleteExam);
  }

  function handleEditClick(exam: LicenseExam) {
    examState.setTempId(exam.id);
    openModal(ModalIds.ManageExam);
  }

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewLicenseExams, Permissions.ManageLicenseExams],
      }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("licenseExams.exams")}</Title>

        {hasManagePermissions ? (
          <div>
            <Button onPress={() => openModal(ModalIds.ManageExam)}>
              {t("licenseExams.createExam")}
            </Button>
          </div>
        ) : null}
      </header>

      {asyncTable.items.length <= 0 ? (
        <p className="mt-5">{t("licenseExams.noExams")}</p>
      ) : (
        <>
          <SearchArea
            totalCount={data.totalCount}
            search={{ search, setSearch }}
            asyncTable={asyncTable}
          />

          <Table
            tableState={tableState}
            data={asyncTable.items.map((exam) => {
              const hasPassedOrFailed = exam.status !== LicenseExamStatus.IN_PROGRESS;

              return {
                id: exam.id,
                rowProps: {
                  className: hasPassedOrFailed ? "opacity-60" : undefined,
                },
                type: exam.type,
                citizen: `${exam.citizen.name} ${exam.citizen.surname}`,
                theoryExam: (
                  <span className="capitalize">
                    {exam.theoryExam ? PASS_FAIL_LABELS[exam.theoryExam] : "—"}
                  </span>
                ),
                practiceExam: (
                  <span className="capitalize">
                    {exam.practiceExam ? PASS_FAIL_LABELS[exam.practiceExam] : "—"}
                  </span>
                ),
                status: <Status>{exam.status}</Status>,
                categories: exam.categories?.map((v) => v.value.value).join(", ") || "—",
                license: exam.license.value,
                createdAt: <FullDate>{exam.createdAt}</FullDate>,
                actions: (
                  <>
                    {hasPassedOrFailed ? null : (
                      <Button variant="success" size="xs" onPress={() => handleEditClick(exam)}>
                        {common("edit")}
                      </Button>
                    )}
                    <Button
                      className="ml-2"
                      variant="danger"
                      size="xs"
                      onPress={() => handleDeleteClick(exam)}
                    >
                      {common("delete")}
                    </Button>
                  </>
                ),
              };
            })}
            columns={[
              { header: common("type"), accessorKey: "type" },
              { header: t("Leo.citizen"), accessorKey: "citizen" },
              { header: t("licenseExams.theoryExam"), accessorKey: "theoryExam" },
              { header: t("licenseExams.practiceExam"), accessorKey: "practiceExam" },
              { header: t("Leo.status"), accessorKey: "status" },
              { header: t("licenseExams.categories"), accessorKey: "categories" },
              { header: t("Leo.license"), accessorKey: "license" },
              { header: common("createdAt"), accessorKey: "createdAt" },
              hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
            ]}
          />
        </>
      )}

      <AlertModal
        title={t("licenseExams.deleteExam")}
        id={ModalIds.AlertDeleteExam}
        description={t("licenseExams.alert_deleteExam")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => examState.setTempId(null)}
      />

      <ManageExamModal
        onClose={() => examState.setTempId(null)}
        onCreate={(exam) => {
          asyncTable.append(exam);
        }}
        onUpdate={(oldExam, newExam) => {
          asyncTable.update(oldExam.id, newExam);
          examState.setTempId(null);
        }}
        exam={tempExam}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [exams, values] = await requestAll(req, [
    ["/leo/license-exams", { exams: [], totalCount: 0 }],
    ["/admin/values/driverslicense_category?paths=license", []],
  ]);

  return {
    props: {
      values,
      session: user,
      data: exams,
      messages: {
        ...(await getTranslations(
          ["leo", "licenseExams", "citizen", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
