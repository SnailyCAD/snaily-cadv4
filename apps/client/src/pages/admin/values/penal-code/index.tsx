import * as React from "react";
import { PenalCodeGroup, Rank, ValueType } from "@snailycad/types";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
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
import type { DeletePenalCodeGroupsData, PutValuePositionsData } from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import { hasTableDataChanged } from "lib/admin/values/utils";
import { OptionsDropdown } from "components/admin/values/import/options-dropdown";
import { useRouter } from "next/router";
import { createValueDocumentationURL } from "../[path]";
import { BoxArrowUpRight } from "react-bootstrap-icons";

const ManagePenalCodeGroup = dynamic(
  async () =>
    (await import("components/admin/values/penal-codes/manage-penal-code-group-modal"))
      .ManagePenalCodeGroup,
  { ssr: false },
);

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});

const ImportValuesModal = dynamic(
  async () =>
    (await import("components/admin/values/import/import-values-modal")).ImportValuesModal,
  { ssr: false },
);

interface Props {
  groups: { groups: PenalCodeGroup[]; totalCount: number };
}

export default function PenalCodeGroupsPage(props: Props) {
  const t = useTranslations("PENAL_CODE_GROUP");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { execute, state } = useFetch();
  const router = useRouter();

  const ungroupedGroup = {
    id: "ungrouped",
    name: t("ungrouped"),
  } as PenalCodeGroup;

  const initialGroups = React.useMemo(() => {
    return [ungroupedGroup, ...props.groups.groups];
  }, [props.groups.groups]); // eslint-disable-line react-hooks/exhaustive-deps

  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: Props["groups"]) => ({
        data: [ungroupedGroup, ...json.groups],
        totalCount: json.totalCount + 1,
      }),
      path: "/admin/penal-code-group",
      requireFilterText: true,
    },
    initialData: initialGroups,
    totalCount: props.groups.totalCount + 1,
    search,
  });

  const tableState = useTableState({
    dragDrop: {
      onListChange,
      disabledIndices: [asyncTable.items.findIndex((v) => v.id === "ungrouped")],
    },
    pagination: asyncTable.pagination,
  });
  const [tempGroup, groupState] = useTemporaryItem(asyncTable.items);

  async function onListChange(list: PenalCodeGroup[]) {
    if (!hasTableDataChanged(asyncTable.items, list)) return;

    for (const [index, value] of list.entries()) {
      value.position = index;

      asyncTable.move(value.id, index);
      asyncTable.update(value.id, value);
    }

    await execute<PutValuePositionsData>({
      path: "/admin/values/penal_code_group/positions",
      method: "PUT",
      data: {
        ids: list.filter((v) => v.id !== "ungrouped").map((v) => v.id),
      },
    });
  }

  function handleEditGroup(groupId: string) {
    groupState.setTempId(groupId);
    openModal(ModalIds.ManagePenalCodeGroup);
  }

  function handleDeleteGroupClick(groupId: string) {
    groupState.setTempId(groupId);
    openModal(ModalIds.AlertDeleteGroup);
  }

  async function handleDeleteGroup() {
    if (!tempGroup) return;

    const { json } = await execute<DeletePenalCodeGroupsData>({
      path: `/admin/penal-code-group/${tempGroup.id}`,
      method: "DELETE",
    });

    if (json) {
      asyncTable.remove(tempGroup.id);
      groupState.setTempId(null);
      closeModal(ModalIds.AlertDeleteGroup);
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
          <Button onPress={() => openModal(ModalIds.ManagePenalCodeGroup)}>{t("ADD")}</Button>
          {/* values is set to non-empty array */}
          <OptionsDropdown type={ValueType.PENAL_CODE} valueLength={asyncTable.items.length} />
        </div>
      </header>

      <SearchArea
        search={{ search, setSearch }}
        asyncTable={asyncTable}
        totalCount={props.groups.totalCount}
      />

      <Table
        features={{ dragAndDrop: true }}
        tableState={tableState}
        data={asyncTable.items.map((group) => ({
          id: group.id,
          rowProps: { value: group },
          value: group.name,
          actions: (
            <>
              <Link
                className={classNames("rounded-md", buttonSizes.xs, buttonVariants.default)}
                href={`/admin/values/penal-code/${group.id}`}
              >
                {common("view")}
              </Link>
              {group.id !== "ungrouped" ? (
                <>
                  <Button
                    className="ml-2"
                    onPress={() => handleEditGroup(group.id)}
                    size="xs"
                    variant="success"
                    disabled={group.id === "ungrouped"}
                  >
                    {common("edit")}
                  </Button>
                  <Button
                    className="ml-2"
                    onPress={() => handleDeleteGroupClick(group.id)}
                    size="xs"
                    variant="danger"
                    disabled={group.id === "ungrouped"}
                  >
                    {common("delete")}
                  </Button>
                </>
              ) : null}
            </>
          ),
        }))}
        columns={[
          { header: common("name"), accessorKey: "value" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />

      <ManagePenalCodeGroup
        onUpdate={(previousGroup, newGroup) => {
          asyncTable.update(previousGroup.id, newGroup);
          groupState.setTempId(null);
        }}
        onCreate={(group) => asyncTable.append(group)}
        onClose={() => groupState.setTempId(null)}
        group={tempGroup}
      />

      <AlertModal
        id={ModalIds.AlertDeleteGroup}
        description={t.rich("alert_deletePenalCodeGroup", {
          span: (children) => <span className="font-bold">{children}</span>,
          group: tempGroup?.name ?? "",
        })}
        onDeleteClick={handleDeleteGroup}
        title={t("deleteGroup")}
        state={state}
      />

      <ImportValuesModal
        onImport={() => router.replace("/admin/values/penal-code", undefined, { shallow: true })}
        type={ValueType.PENAL_CODE}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [groups] = await requestAll(req, [
    ["/admin/penal-code-group", { totalCount: 0, groups: [] }],
  ]);

  return {
    props: {
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
      session: user,
      groups,
    },
  };
};
