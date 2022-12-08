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
import { requestAll, yesOrNoText } from "lib/utils";
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
import { toastMessage } from "lib/toastMessage";

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
  const [paginationOptions, setPagination] = React.useState({
    pageSize: 35,
    pageIndex: 0,
  });

  const { isOpen, openModal, closeModal } = useModal();

  function handleViewAllGroups() {
    setCurrentGroup(null);
    setValues(data);
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageValuePenalCode],
      }}
    >
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
