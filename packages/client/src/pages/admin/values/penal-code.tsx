import { useTranslations } from "use-intl";
import * as React from "react";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { useModal } from "context/ModalContext";
import { PenalCode, PenalCodeGroup, ValueType } from "types/prisma";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import dynamic from "next/dynamic";
import { Table } from "components/shared/Table";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { ArrowLeft } from "react-bootstrap-icons";
import { ModalIds } from "types/ModalIds";
import { ManagePenalCodeGroup } from "components/admin/values/penal-codes/ManagePenalCodeGroup";
import { AlertModal } from "components/modal/AlertModal";
import { useRouter } from "next/router";
import { Title } from "components/shared/Title";

const ManagePenalCode = dynamic(async () => {
  return (await import("components/admin/values/penal-codes/ManagePenalCode")).ManagePenalCode;
});

interface Props {
  values: { type: ValueType; groups: PenalCodeGroup[]; values: PenalCode[] };
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

  const [groups, setGroups] = React.useState<PenalCodeGroup[]>([...groupData, ungroupedGroup]);
  const [currentGroup, setCurrentGroup] = React.useState<PenalCodeGroup | null>(null);
  const [tempGroup, setTempGroup] = React.useState<PenalCodeGroup | null>(null);

  const [search, setSearch] = React.useState("");
  const [tempValue, setTempValue] = React.useState<PenalCode | null>(null);
  const { state, execute } = useFetch();

  const { isOpen, openModal, closeModal } = useModal();
  const router = useRouter();

  function handleDeleteClick(value: PenalCode) {
    setTempValue(value);
    openModal("deleteValue");
  }

  function handleEditClick(value: PenalCode) {
    setTempValue(value);
    openModal("manageValue");
  }

  function handleEditGroup(group: PenalCodeGroup) {
    setTempGroup(group);
    openModal(ModalIds.ManagePenalCodeGroup);
  }

  function handleDeleteGroupClick(group: PenalCodeGroup) {
    setTempGroup(group);
    openModal(ModalIds.AlertDeleteGroup);
  }

  async function handleDeleteGroup() {
    if (!tempGroup) return;

    const { json } = await execute(`/admin/penal-code-group/${tempGroup.id}`, {
      method: "DELETE",
    });

    if (json) {
      router.replace({ pathname: router.pathname, query: router.query });
      setTempGroup(null);
      closeModal(ModalIds.AlertDeleteGroup);
    }
  }

  async function handleDelete() {
    if (!tempValue) return;

    try {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${tempValue.id}`, {
        method: "DELETE",
      });

      if (json) {
        setValues((p) => p.filter((v) => v.id !== tempValue.id));
        setTempValue(null);
        closeModal("deleteValue");
      }
    } catch (err) {
      console.log({ err });
    }
  }

  React.useEffect(() => {
    setValues(data);
  }, [data]);

  React.useEffect(() => {
    // reset form values
    if (!isOpen("manageValue") && !isOpen("deleteValue")) {
      // timeout: wait for modal to close
      setTimeout(() => setTempValue(null), 100);
    }
  }, [isOpen]);

  return (
    <AdminLayout className="dark:text-white">
      <Title>{typeT("MANAGE")}</Title>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{typeT("MANAGE")}</h1>

        <div className="flex gap-2">
          <Button onClick={() => openModal("manageValue")}>{typeT("ADD")}</Button>
          <Button onClick={() => openModal(ModalIds.ManagePenalCodeGroup)}>
            {t("addPenalCodeGroup")}
          </Button>
        </div>
      </header>

      <FormField label={common("search")} className="my-2">
        <Input onChange={(e) => setSearch(e.target.value)} value={search} className="" />
      </FormField>

      {values.length <= 0 ? (
        <p className="mt-5">There are no penal codes yet.</p>
      ) : currentGroup ? (
        <>
          <header className="flex items-center justify-between">
            <h1 className="text-xl font-semibold capitalize">{currentGroup.name}</h1>

            <Button onClick={() => setCurrentGroup(null)} className="flex items-center gap-3">
              <ArrowLeft /> View all groups
            </Button>
          </header>

          <Table
            filter={search}
            data={values
              .filter((v) =>
                currentGroup.id === "ungrouped" && v.groupId === null
                  ? true
                  : v.groupId === currentGroup.id,
              )
              .map((code) => ({
                title: code.title,
                description: (
                  <p className="max-w-4xl min-w-[300px] break-words whitespace-pre-wrap">
                    {code.description}
                  </p>
                ),
                actions: (
                  <>
                    <Button onClick={() => handleEditClick(code)} small variant="success">
                      {common("edit")}
                    </Button>
                    <Button
                      className="ml-2"
                      onClick={() => handleDeleteClick(code)}
                      small
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  </>
                ),
              }))}
            columns={[
              { Header: common("title"), accessor: "title" },
              { Header: common("description"), accessor: "description" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        </>
      ) : (
        <Table
          filter={search}
          data={groups.map((group) => ({
            value: group.name,
            actions: (
              <>
                <Button onClick={() => setCurrentGroup(group)} small>
                  {common("view")}
                </Button>
                {group.id !== "ungrouped" ? (
                  <>
                    <Button
                      className="ml-2"
                      onClick={() => handleEditGroup(group)}
                      small
                      variant="success"
                      disabled={group.id === "ungrouped"}
                    >
                      {common("edit")}
                    </Button>
                    <Button
                      className="ml-2"
                      onClick={() => handleDeleteGroupClick(group)}
                      small
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
            { Header: common("name"), accessor: "value" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <Modal
        title={typeT("DELETE")}
        onClose={() => closeModal("deleteValue")}
        isOpen={isOpen("deleteValue")}
      >
        <p className="my-3">
          {t.rich("alert_deleteValue", {
            value: tempValue?.title ?? "",
            span: (children) => {
              return <span className="font-semibold">{children}</span>;
            },
          })}
        </p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            variant="cancel"
            disabled={state === "loading"}
            onClick={() => closeModal("deleteValue")}
          >
            {common("cancel")}
          </Button>
          <Button
            disabled={state === "loading"}
            className="flex items-center"
            variant="danger"
            onClick={handleDelete}
          >
            {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
            {common("delete")}
          </Button>
        </div>
      </Modal>

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
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [values] = await requestAll(req, [["/admin/values/penal_code", []]]);

  return {
    props: {
      values: values?.[0] ?? {},
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};
