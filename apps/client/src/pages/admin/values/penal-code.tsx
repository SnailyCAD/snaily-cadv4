import { useTranslations } from "use-intl";
import * as React from "react";
import { Button, TextField } from "@snailycad/ui";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import { type PenalCode, type PenalCodeGroup, ValueType, Rank } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import dynamic from "next/dynamic";
import { Table, useTableState } from "components/shared/Table";
import { ArrowLeft } from "react-bootstrap-icons";
import { ModalIds } from "types/ModalIds";
import { ManagePenalCodeGroup } from "components/admin/values/penal-codes/ManagePenalCodeGroup";
import { AlertModal } from "components/modal/AlertModal";
import { Title } from "components/shared/Title";
import { OptionsDropdown } from "components/admin/values/import/OptionsDropdown";
import { ImportValuesModal } from "components/admin/values/import/ImportValuesModal";
import { Permissions } from "@snailycad/permissions";
import type {
  DeleteValueByIdData,
  GetValuesPenalCodesData,
  PutValuePositionsData,
  DeletePenalCodeGroupsData,
} from "@snailycad/types/api";
import { hasTableDataChanged } from "lib/admin/values/utils";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

const ManagePenalCode = dynamic(async () => {
  return (await import("components/admin/values/penal-codes/ManagePenalCode")).ManagePenalCode;
});

interface Props {
  values: GetValuesPenalCodesData[number];
}

export default function ValuePath({ values: { type, groups: groupData, values: data } }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Values");
  const typeT = useTranslations(type);

  const ungroupedGroup = {
    id: "ungrouped",
    name: t("ungrouped"),
  } as PenalCodeGroup;

  const [values, setValues] = React.useState<PenalCode[]>(data);

  const [groups, setGroups] = React.useState<PenalCodeGroup[]>([
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    ...(groupData ?? []),
    ungroupedGroup,
  ]);
  const [currentGroup, setCurrentGroup] = React.useState<PenalCodeGroup | null>(null);
  const [tempGroup, setTempGroup] = React.useState<PenalCodeGroup | null>(null);

  const [search, setSearch] = React.useState("");
  const [tempValue, setTempValue] = React.useState<PenalCode | null>(null);
  const { state, execute } = useFetch();
  const tableState = useTableState({
    search: { value: search },
    dragDrop: {
      onListChange: setList,
      disabledIndices: [groups.findIndex((v) => v.id === "ungrouped")],
    },
  });

  const { isOpen, openModal, closeModal } = useModal();

  function handleDeleteClick(value: PenalCode) {
    setTempValue(value);
    openModal(ModalIds.AlertDeleteValue);
  }

  function handleEditClick(value: PenalCode) {
    setTempValue(value);
    openModal(ModalIds.ManageValue);
  }

  function handleEditGroup(group: PenalCodeGroup) {
    setTempGroup(group);
    openModal(ModalIds.ManagePenalCodeGroup);
  }

  function handleDeleteGroupClick(group: PenalCodeGroup) {
    setTempGroup(group);
    openModal(ModalIds.AlertDeleteGroup);
  }

  function handleViewAllGroups() {
    setCurrentGroup(null);
    setValues(data);
  }

  async function handleDeleteGroup() {
    if (!tempGroup) return;

    const { json } = await execute<DeletePenalCodeGroupsData>({
      path: `/admin/penal-code-group/${tempGroup.id}`,
      method: "DELETE",
    });

    if (json) {
      setValues((p) =>
        p.map((penalCode) => {
          if (penalCode.groupId === tempGroup.id) {
            return { ...penalCode, groupId: "ungrouped" };
          }

          return penalCode;
        }),
      );
      setTempGroup(null);
      setGroups((p) => p.filter((v) => v.id !== tempGroup.id));
      closeModal(ModalIds.AlertDeleteGroup);
    }
  }

  async function setList(list: (PenalCode | PenalCodeGroup)[]) {
    const valuesToCheck = currentGroup ? groups : values;
    if (!hasTableDataChanged(valuesToCheck, list)) return;

    if (currentGroup) {
      // @ts-expect-error todo: setup `type` check
      setGroups((p) =>
        list.map((v, idx) => {
          const prev = p.find((a) => a.id === v.id);

          if (prev) {
            prev.position = idx;
          }

          return v;
        }),
      );
    } else {
      // @ts-expect-error todo: setup `type` check
      setValues((p) =>
        list.map((v, idx) => {
          const prev = p.find((a) => a.id === v.id);

          if (prev) {
            prev.position = idx;
          }

          return v;
        }),
      );
    }

    await execute<PutValuePositionsData>({
      path: `/admin/values/${type.toLowerCase()}/positions`,
      method: "PUT",
      data: {
        ids: list
          .filter((v) => v.id !== "ungrouped")
          .map((v) => {
            return v.id;
          }),
      },
    });
  }

  async function handleDelete() {
    if (!tempValue) return;

    const { json } = await execute<DeleteValueByIdData>({
      path: `/admin/values/${type.toLowerCase()}/${tempValue.id}`,
      method: "DELETE",
    });

    if (json) {
      setValues((p) => p.filter((v) => v.id !== tempValue.id));
      setTempValue(null);
      closeModal(ModalIds.AlertDeleteValue);
    }
  }

  React.useEffect(() => {
    setValues(data);
  }, [data]);

  React.useEffect(() => {
    // reset form values
    if (!isOpen(ModalIds.ManageValue) && !isOpen(ModalIds.AlertDeleteValue)) {
      // timeout: wait for modal to close
      setTimeout(() => setTempValue(null), 100);
    }
  }, [isOpen]);

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageValuePenalCode],
      }}
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{typeT("MANAGE")}</Title>

        <div className="flex gap-2">
          <Button onPress={() => openModal(ModalIds.ManageValue)}>{typeT("ADD")}</Button>
          <Button onPress={() => openModal(ModalIds.ManagePenalCodeGroup)}>
            {t("addPenalCodeGroup")}
          </Button>
          <OptionsDropdown type={type} values={data} />
        </div>
      </header>

      <TextField
        label={common("search")}
        className="my-2"
        name="search"
        value={search}
        onChange={(value) => setSearch(value)}
      />

      {values.length <= 0 && !currentGroup ? (
        <p className="mt-5">There are no penal codes yet.</p>
      ) : currentGroup ? (
        <>
          <header className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{currentGroup.name}</h1>

            <Button onPress={handleViewAllGroups} className="flex items-center gap-3">
              <ArrowLeft /> View all groups
            </Button>
          </header>

          <Table
            tableState={tableState}
            data={values
              .filter((v) =>
                currentGroup.id === "ungrouped" && v.groupId === null
                  ? true
                  : v.groupId === currentGroup.id,
              )
              .map((code) => ({
                id: code.id,
                rowProps: { value: code },
                title: code.title,
                type: code.type?.toLowerCase() ?? common("none"),
                description: <CallDescription nonCard data={code} />,
                actions: (
                  <>
                    <Button onPress={() => handleEditClick(code)} size="xs" variant="success">
                      {common("edit")}
                    </Button>
                    <Button
                      className="ml-2"
                      onPress={() => handleDeleteClick(code)}
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
              { header: common("description"), accessorKey: "description" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        </>
      ) : (
        <Table
          tableState={tableState}
          data={groups.map((group) => ({
            id: group.id,
            rowProps: { value: group },
            value: group.name,
            actions: (
              <>
                <Button onPress={() => setCurrentGroup(group)} size="xs">
                  {common("view")}
                </Button>
                {group.id !== "ungrouped" ? (
                  <>
                    <Button
                      className="ml-2"
                      onPress={() => handleEditGroup(group)}
                      size="xs"
                      variant="success"
                      disabled={group.id === "ungrouped"}
                    >
                      {common("edit")}
                    </Button>
                    <Button
                      className="ml-2"
                      onPress={() => handleDeleteGroupClick(group)}
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
      )}

      <AlertModal
        id={ModalIds.AlertDeleteValue}
        description={t.rich("alert_deleteValue", {
          value: tempValue?.title ?? "",
          span: (children) => {
            return <span className="font-semibold">{children}</span>;
          },
        })}
        onDeleteClick={handleDelete}
        title={typeT("DELETE")}
        state={state}
        onClose={() => {
          // wait for animation to play out
          setTimeout(() => setTempValue(null), 100);
        }}
      />

      <ManagePenalCode
        groups={groups}
        onCreate={(value) => {
          setValues((p) => [...p, value]);
        }}
        onUpdate={(old, newV) => {
          setValues((p) => {
            const idx = p.indexOf(old);
            p[idx] = newV;

            return p;
          });
        }}
        penalCode={tempValue}
        type={type}
      />

      <ManagePenalCodeGroup
        onUpdate={(old, newG) => {
          setGroups((prev) => {
            const index = prev.indexOf(old);
            prev[index] = newG;

            return prev;
          });
        }}
        onCreate={(group) => setGroups((p) => [group, ...p])}
        onClose={() => setTempGroup(null)}
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
        type={ValueType.PENAL_CODE}
        onImport={(data) => setValues((p) => [...data, ...p])}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [values] = await requestAll(req, [["/admin/values/penal_code", []]]);

  return {
    props: {
      values: values?.[0] ?? {},
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};
