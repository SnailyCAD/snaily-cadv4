import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { DLExam, DLExamStatus } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { Permissions } from "@snailycad/permissions";
import { Status } from "components/shared/Status";
import { ManageDLExamModal } from "components/leo/dl-exams/ManageDLExamModal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { usePermission } from "hooks/usePermission";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import type { DeleteDLExamByIdData, GetDLExamsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  data: GetDLExamsData;
}

export default function CitizenLogs({ data }: Props) {
  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const cT = useTranslations("Vehicles");
  const { state, execute } = useFetch();

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: GetDLExamsData) => ({ data: json.exams, totalCount: json.totalCount }),
      path: "/leo/dl-exams",
    },
    totalCount: data.totalCount,
    initialData: data.exams,
  });
  const [tempExam, examState] = useTemporaryItem(asyncTable.data);

  const PASS_FAIL_LABELS = {
    PASSED: cT("passed"),
    FAILED: cT("failed"),
    IN_PROGRESS: cT("inProgress"),
  };

  async function handleDelete() {
    if (!tempExam) return;
    const { json } = await execute<DeleteDLExamByIdData>({
      path: `/leo/dl-exams/${tempExam.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      closeModal(ModalIds.AlertDeleteDLExam);
      asyncTable.setData((p) => p.filter((v) => v.id !== tempExam.id));
      examState.setTempId(null);
    }
  }

  function handleDeleteClick(exam: DLExam) {
    examState.setTempId(exam.id);
    openModal(ModalIds.AlertDeleteDLExam);
  }

  function handleEditClick(exam: DLExam) {
    examState.setTempId(exam.id);
    openModal(ModalIds.ManageDLExam);
  }

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewDLExams, Permissions.ManageDLExams],
      }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("DLExams")}</Title>

        {hasPermissions([Permissions.ManageDLExams], (u) => u.isSupervisor) ? (
          <div>
            <Button onClick={() => openModal(ModalIds.ManageDLExam)}>{t("createDLExam")}</Button>
          </div>
        ) : null}
      </header>

      {data.exams.length <= 0 ? (
        <p className="mt-5">{t("noDLExams")}</p>
      ) : (
        <>
          <FormField label={common("search")} className="my-2">
            <Input
              onChange={(e) => asyncTable.search.setSearch(e.target.value)}
              value={asyncTable.search.search}
            />
          </FormField>

          {asyncTable.search.search && asyncTable.pagination.totalDataCount !== data.totalCount ? (
            <p className="italic text-base font-semibold">
              Showing {asyncTable.pagination.totalDataCount} result(s)
            </p>
          ) : null}

          <Table
            pagination={{
              enabled: true,
              totalCount: asyncTable.pagination.totalDataCount,
              fetchData: asyncTable.pagination,
            }}
            data={asyncTable.data.map((exam) => {
              const hasPassedOrFailed = exam.status !== DLExamStatus.IN_PROGRESS;
              return {
                rowProps: {
                  className: hasPassedOrFailed ? "opacity-60" : undefined,
                },
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
                status: <Status state={exam.status}>{PASS_FAIL_LABELS[exam.status]}</Status>,
                categories: exam.categories?.map((v) => v.value.value).join(", ") || "—",
                license: exam.license.value,
                createdAt: <FullDate>{exam.createdAt}</FullDate>,
                actions: (
                  <>
                    {hasPassedOrFailed ? null : (
                      <Button variant="success" size="xs" onClick={() => handleEditClick(exam)}>
                        {common("edit")}
                      </Button>
                    )}
                    <Button
                      className="ml-2"
                      variant="danger"
                      size="xs"
                      onClick={() => handleDeleteClick(exam)}
                    >
                      {common("delete")}
                    </Button>
                  </>
                ),
              };
            })}
            columns={[
              { Header: t("citizen"), accessor: "citizen" },
              { Header: t("theoryExam"), accessor: "theoryExam" },
              { Header: t("practiceExam"), accessor: "practiceExam" },
              { Header: t("status"), accessor: "status" },
              { Header: t("categories"), accessor: "categories" },
              { Header: t("license"), accessor: "license" },
              { Header: common("createdAt"), accessor: "createdAt" },
              hasPermissions([Permissions.ManageDLExams], (u) => u.isSupervisor)
                ? { Header: common("actions"), accessor: "actions" }
                : null,
            ]}
          />
        </>
      )}

      <AlertModal
        title={t("deleteDLExam")}
        id={ModalIds.AlertDeleteDLExam}
        description={t("alert_deleteDLExam")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => examState.setTempId(null)}
      />

      <ManageDLExamModal
        onClose={() => examState.setTempId(null)}
        onCreate={(exam) => {
          asyncTable.setData((p) => [exam, ...p]);
        }}
        onUpdate={(oldExam, newExam) => {
          asyncTable.setData((prev) => {
            const idx = prev.findIndex((v) => v.id === oldExam.id);
            prev[idx] = newExam;

            return prev;
          });
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
    ["/leo/dl-exams", { exams: [], totalCount: 0 }],
    ["/admin/values/driverslicense_category?paths=license", []],
  ]);

  return {
    props: {
      values,
      session: user,
      data: exams,
      messages: {
        ...(await getTranslations(["leo", "citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};
