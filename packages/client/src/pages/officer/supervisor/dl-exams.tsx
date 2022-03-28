import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { DLExam } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { Permissions } from "@snailycad/permissions";
import { Status } from "components/shared/Status";
import { ManageDLExamModal } from "components/leo/dl-exams/ManageDLExamModal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { usePermission } from "hooks/usePermission";

interface Props {
  exams: DLExam[];
}

export default function CitizenLogs({ exams: data }: Props) {
  const [exams, setExams] = React.useState(data);
  const [search, setSearch] = React.useState("");
  const [tempExam, setTempExam] = React.useState<DLExam | null>(null);

  const { hasPermissions } = usePermission();
  const { openModal } = useModal();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

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
      <Title>{t("DLExams")}</Title>

      <header className="flex items-center justify-between">
        <h1 className="mb-3 text-3xl font-semibold">{t("DLExams")}</h1>

        {hasPermissions([Permissions.ManageDLExams], (u) => u.isSupervisor) ? (
          <div>
            <Button onClick={() => openModal(ModalIds.ManageDLExam)}>{t("createDLExam")}</Button>
          </div>
        ) : null}
      </header>

      {console.log({ exams })}

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
            data={exams.map((exam) => ({
              citizen: `${exam.citizen.name} ${exam.citizen.surname}`,
              theoryExam: (
                <span className="capitalize">{exam.theoryExam?.toLowerCase() ?? "—"}</span>
              ),
              practiceExam: (
                <span className="capitalize">{exam.practiceExam?.toLowerCase() ?? "—"}</span>
              ),
              status: <Status state={exam.status}>{exam.status.toLowerCase()}</Status>,
              createdAt: <FullDate>{exam.createdAt}</FullDate>,
              actions: (
                <Button small onClick={() => handleEditClick(exam)}>
                  {common("edit")}
                </Button>
              ),
            }))}
            columns={[
              { Header: t("citizen"), accessor: "citizen" },
              { Header: t("theoryExam"), accessor: "theoryExam" },
              { Header: t("practiceExam"), accessor: "practiceExam" },
              { Header: t("status"), accessor: "status" },
              { Header: common("createdAt"), accessor: "createdAt" },
              hasPermissions([Permissions.ManageDLExams], (u) => u.isSupervisor)
                ? { Header: common("actions"), accessor: "actions" }
                : null,
            ]}
          />
        </>
      )}

      <ManageDLExamModal
        onCreate={(exam) => {
          setExams((p) => [exam, ...p]);
        }}
        onUpdate={(oldExam, newExam) => {
          setExams((prev) => {
            const idx = prev.findIndex((v) => v.id === oldExam.id);
            prev[idx] = newExam;

            return prev;
          });
        }}
        exam={tempExam}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [exams] = await requestAll(req, [["/leo/dl-exams", []]]);

  return {
    props: {
      session: await getSessionUser(req),
      exams,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
