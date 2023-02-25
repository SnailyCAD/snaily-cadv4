import * as React from "react";
import { Rank, ValueType } from "@snailycad/types";
import { getSelectedTableRows, Table, useAsyncTable, useTableState } from "components/shared/Table";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { getObjLength, isEmpty, requestAll, yesOrNoText } from "lib/utils";
import type { GetServerSideProps } from "next";
import { SearchArea } from "components/shared/search/search-area";
import { Title } from "components/shared/Title";
import { AdminLayout } from "components/admin/AdminLayout";
import { Permissions } from "@snailycad/permissions";
import { Button, buttonSizes, buttonVariants } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import dynamic from "next/dynamic";
import { ModalIds } from "types/ModalIds";
import Link from "next/link";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useModal } from "state/modalState";
import { classNames } from "lib/classNames";
import type {
  DeleteValueByIdData,
  DeleteValuesBulkData,
  GetValuesPenalCodesData,
} from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { ArrowLeft, BoxArrowUpRight } from "react-bootstrap-icons";
import { toastMessage } from "lib/toastMessage";
import { createValueDocumentationURL } from "../[path]";

const ManagePenalCode = dynamic(
  async () =>
    (await import("components/admin/values/penal-codes/manage-penal-code-modal")).ManagePenalCode,
  { ssr: false },
);

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});

interface Props {
  penalCodes: GetValuesPenalCodesData[number];
}

export default function PenalCodeGroupsPage(props: Props) {
  const t = useTranslations("PENAL_CODE");
  const valuesT = useTranslations("Values");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { execute, state } = useFetch();
  const router = useRouter();
  const groupId = router.query.groupId as string;

  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: GetValuesPenalCodesData) => ({
        data: json[0]?.values ?? [],
        totalCount: json[0]?.totalCount ?? 0,
      }),
      path: `/admin/values/penal_code?groupId=${groupId}&includeAll=false&cache=false`,
      requireFilterText: true,
    },
    initialData: props.penalCodes.values,
    totalCount: props.penalCodes.totalCount,
    search,
  });

  const tableState = useTableState({
    pagination: asyncTable.pagination,
  });
  const [tempPenalCode, penalCodeState] = useTemporaryItem(asyncTable.items);

  function handleDeleteClick(penalCodeId: string) {
    penalCodeState.setTempId(penalCodeId);
    openModal(ModalIds.AlertDeleteValue);
  }

  function handleEditClick(penalCodeId: string) {
    penalCodeState.setTempId(penalCodeId);
    openModal(ModalIds.ManageValue);
  }

  async function handleDeleteSelected() {
    const selectedRows = getSelectedTableRows(asyncTable.items, tableState.rowSelection);

    const { json } = await execute<DeleteValuesBulkData>({
      path: "/admin/values/penal_code/bulk-delete",
      method: "DELETE",
      data: selectedRows,
    });

    if (json) {
      asyncTable.remove(...selectedRows);

      tableState.setRowSelection({});
      closeModal(ModalIds.AlertDeleteSelectedValues);

      toastMessage({
        title: "Delete Values",
        icon: "info",
        message: valuesT("deletedSelectedValues", {
          failed: json.failed,
          deleted: json.success,
        }),
      });
    }
  }

  async function handleDelete() {
    if (!tempPenalCode) return;

    const { json } = await execute<DeleteValueByIdData>({
      path: `/admin/values/penal_code/${tempPenalCode.id}`,
      method: "DELETE",
    });

    if (typeof json === "string") {
      toastMessage({
        title: "Delete Value",
        icon: "info",
        message: valuesT.rich("failedDeleteValue", {
          value: tempPenalCode.title,
        }),
      });

      penalCodeState.setTempId(null);
      closeModal(ModalIds.AlertDeleteValue);
    } else {
      if (json) {
        asyncTable.remove(tempPenalCode.id);
        penalCodeState.setTempId(null);
        closeModal(ModalIds.AlertDeleteValue);
      }
    }
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageValuePenalCode],
      }}
    >
      <header className="flex items-center justify-between">
        <div>
          <Title className="!mb-0">{t("MANAGE")}</Title>
          <Link
            className="mt-1 underline flex items-center gap-1 text-blue-500"
            target="_blank"
            href={createValueDocumentationURL(ValueType.PENAL_CODE)}
          >
            {common("learnMore")}
            <BoxArrowUpRight className="inline-block" />
          </Link>
        </div>

        <div className="flex gap-2">
          {isEmpty(tableState.rowSelection) ? null : (
            <Button onPress={() => openModal(ModalIds.AlertDeleteSelectedValues)} variant="danger">
              {valuesT("deleteSelectedValues")}
            </Button>
          )}
          <Link
            href="/admin/values/penal-code"
            className={classNames(
              "flex items-center gap-3 rounded-md",
              buttonSizes.sm,
              buttonVariants.default,
            )}
          >
            <ArrowLeft /> View all groups
          </Link>

          <Button onPress={() => openModal(ModalIds.ManageValue)}>{t("ADD")}</Button>
        </div>
      </header>

      <SearchArea search={{ search, setSearch }} asyncTable={asyncTable} totalCount={0} />

      <Table
        features={{ rowSelection: true }}
        tableState={tableState}
        data={asyncTable.items.map((penalCode) => ({
          id: penalCode.id,
          rowProps: { value: penalCode },
          title: penalCode.title,
          type: penalCode.type?.toLowerCase() ?? common("none"),
          isPrimary: common(yesOrNoText(penalCode.isPrimary)),
          description: <CallDescription nonCard data={penalCode} />,
          actions: (
            <>
              <Button onPress={() => handleEditClick(penalCode.id)} size="xs" variant="success">
                {common("edit")}
              </Button>
              <Button
                className="ml-2"
                onPress={() => handleDeleteClick(penalCode.id)}
                size="xs"
                variant="danger"
              >
                {common("delete")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { header: common("title"), accessorKey: "title" },
          { header: common("type"), accessorKey: "type" },
          { header: "Is Primary", accessorKey: "isPrimary" },
          { header: common("description"), accessorKey: "description" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />

      <ManagePenalCode
        groupId={groupId}
        onCreate={(value: any) => {
          asyncTable.prepend(value);
        }}
        onUpdate={(previousPenalCode, newPenalCode: any) => {
          asyncTable.update(previousPenalCode.id, newPenalCode);
        }}
        penalCode={tempPenalCode}
        type={ValueType.PENAL_CODE}
        onClose={() => {
          penalCodeState.setTempId(null);
        }}
      />

      <AlertModal
        id={ModalIds.AlertDeleteValue}
        description={valuesT.rich("alert_deleteValue", {
          value: tempPenalCode?.title ?? "",
        })}
        onDeleteClick={handleDelete}
        title={t("DELETE")}
        state={state}
        onClose={() => {
          // wait for animation to play out
          setTimeout(() => penalCodeState.setTempId(null), 100);
        }}
      />

      <AlertModal
        id={ModalIds.AlertDeleteSelectedValues}
        description={valuesT("alert_deleteSelectedValues", {
          length: getObjLength(tableState.rowSelection),
        })}
        onDeleteClick={handleDeleteSelected}
        title={t("DELETE")}
        state={state}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req, query }) => {
  const user = await getSessionUser(req);
  const [penalCodes] = await requestAll(req, [
    [
      `/admin/values/penal_code?groupId=${query.groupId}&includeAll=false&cache=false`,
      { totalCount: 0, values: [], type: "PENAL_CODE" },
    ],
  ]);

  return {
    props: {
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
      session: user,
      penalCodes: penalCodes[0] ?? null,
    },
  };
};
