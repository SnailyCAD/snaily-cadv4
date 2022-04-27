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

interface Props {
  exams: DLExam[];
}

export default function CitizenLogs({ exams: data }: Props) {
  const [exams, setExams] = React.useState(data);
  const [search, setSearch] = React.useState("");
  const [tempExam, setTempExam] = React.useState<DLExam | null>(null);

  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const cT = useTranslations("Vehicles");
  const { state, execute } = useFetch();

  const PASS_FAIL_LABELS = {
    PASSED: cT("passed"),
    FAILED: cT("failed"),
    IN_PROGRESS: cT("inProgress"),
  };

  async function handleDelete() {
    if (!tempExam) return;
    const { json } = await execute(`/leo/dl-exams/${tempExam.id}`, {
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      closeModal(ModalIds.AlertDeleteDLExam);
      setExams((p) => p.filter((v) => v.id !== tempExam.id));
      setTempExam(null);
    }
  }

  function handleDeleteClick(exam: DLExam) {
    setTempExam(exam);
    openModal(ModalIds.AlertDeleteDLExam);
  }

  function handleEditClick(exam: DLExam) {
    setTempExam(exam);
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

      {exams.length <= 0 ? (
        <p className="mt-5">{t("noDLExams")}</p>
      ) : (
        <>
          <FormField label={common("search")} className="my-2">
            <Input onChange={(e) => setSearch(e.target.value)} value={search} />
          </FormField>

          <Table
            filter={search}
            defaultSort={{
              columnId: "createdAt",
              descending: true,
            }}
            data={exams.map((exam) => {
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
                      <Button variant="success" small onClick={() => handleEditClick(exam)}>
                        {common("edit")}
                      </Button>
                    )}
                    <Button
                      className="ml-2"
                      variant="danger"
                      small
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
        onClose={() => setTempExam(null)}
      />

      <ManageDLExamModal
        onClose={() => setTempExam(null)}
        onCreate={(exam) => {
          setExams((p) => [exam, ...p]);
        }}
        onUpdate={(oldExam, newExam) => {
          setExams((prev) => {
            const idx = prev.findIndex((v) => v.id === oldExam.id);
            prev[idx] = newExam;

            return prev;
          });
          setTempExam(null);
        }}
        exam={tempExam}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [exams, values] = await requestAll(req, [
    ["/leo/dl-exams", []],
    ["/admin/values/driverslicense_category?paths=license", []],
  ]);

  return {
    props: {
      values,
      session: await getSessionUser(req),
      exams,
      messages: {
        ...(await getTranslations(["leo", "citizen", "common"], locale)),
      },
    },
  };
};
