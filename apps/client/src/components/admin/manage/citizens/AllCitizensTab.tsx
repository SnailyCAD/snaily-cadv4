import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { Loader, Button, buttonVariants, TextField } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { FormField } from "components/form/FormField";
import { Table, useTableState } from "components/shared/Table";
import { Select } from "components/form/Select";
import Link from "next/link";
import { FullDate } from "components/shared/FullDate";
import { usePermission, Permissions } from "hooks/usePermission";
import { classNames } from "lib/classNames";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import type { DeleteManageCitizenByIdData, GetManageCitizensData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

type CitizenWithUser = GetManageCitizensData["citizens"][number];

interface Props {
  citizens: GetManageCitizensData["citizens"];
  totalCount: number;
  setCitizens: React.Dispatch<React.SetStateAction<GetManageCitizensData["citizens"]>>;
}

export function AllCitizensTab({ citizens: initialData, totalCount, setCitizens }: Props) {
  const asyncTable = useAsyncTable({
    initialData,
    totalCount,
    fetchOptions: {
      path: "/admin/manage/citizens",
      onResponse: (json: GetManageCitizensData) => ({
        totalCount: json.totalCount,
        data: json.citizens,
      }),
    },
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  const [tempValue, valueState] = useTemporaryItem(asyncTable.data);
  const [reason, setReason] = React.useState("");
  const [userFilter, setUserFilter] = React.useState<string | null>(null);
  const users = React.useMemo(() => makeUsersList(asyncTable.data), [asyncTable.data]);
  const { hasPermissions } = usePermission();

  const reasonRef = React.useRef<HTMLInputElement>(null);

  const { state, execute } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();

  const tCitizen = useTranslations("Citizen");
  const t = useTranslations("Management");
  const common = useTranslations("Common");

  function handleDeleteClick(value: CitizenWithUser) {
    valueState.setTempId(value.id);
    openModal(ModalIds.AlertDeleteCitizen);
  }

  async function handleDelete() {
    if (!tempValue) return;

    if (!reason.trim() && reasonRef.current) {
      return reasonRef.current.focus();
    }

    const { json } = await execute<DeleteManageCitizenByIdData>({
      path: `/admin/manage/citizens/${tempValue.id}`,
      method: "DELETE",
      data: { reason },
    });

    if (json) {
      setCitizens((p) => p.filter((v) => v.id !== tempValue.id));
      valueState.setTempId(null);
      closeModal(ModalIds.AlertDeleteCitizen);
    }
  }

  return (
    <>
      {initialData.length <= 0 ? (
        <p className="mt-5">{t("noCitizens")}</p>
      ) : (
        <ul className="mt-5">
          <div className="flex items-center gap-2">
            <TextField
              label={common("search")}
              className="w-full relative"
              name="search"
              onChange={(value) => asyncTable.search.setSearch(value)}
              value={asyncTable.search.search}
              placeholder="John Doe"
            >
              {asyncTable.state === "loading" ? (
                <span className="absolute top-[2.4rem] right-2.5">
                  <Loader />
                </span>
              ) : null}
            </TextField>

            <FormField className="w-40" label="Filter">
              <Select
                isClearable
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                values={users.map((u) => ({
                  label: u.username,
                  value: u.id,
                }))}
              />
            </FormField>
          </div>

          {asyncTable.search.search && asyncTable.pagination.totalDataCount !== totalCount ? (
            <p className="italic text-base font-semibold">
              Showing {asyncTable.pagination.totalDataCount} result(s)
            </p>
          ) : null}

          <Table
            tableState={tableState}
            data={asyncTable.data
              .filter((v) => (userFilter ? String(v.userId) === userFilter : true))
              .map((citizen) => ({
                id: citizen.id,
                name: `${citizen.name} ${citizen.surname}`,
                dateOfBirth: (
                  <FullDate isDateOfBirth onlyDate>
                    {citizen.dateOfBirth}
                  </FullDate>
                ),
                gender: citizen.gender.value,
                ethnicity: citizen.ethnicity.value,
                hairColor: citizen.hairColor,
                eyeColor: citizen.eyeColor,
                weight: citizen.weight,
                height: citizen.height,
                user: citizen.user?.username ?? "No user",
                actions: (
                  <>
                    {hasPermissions([Permissions.ManageCitizens], true) ? (
                      <Link href={`/admin/manage/citizens/${citizen.id}`}>
                        <a
                          href={`/admin/manage/citizens/${citizen.id}`}
                          className={classNames(buttonVariants.success, "p-0.5 px-2 rounded-md")}
                        >
                          {common("edit")}
                        </a>
                      </Link>
                    ) : null}
                    {hasPermissions([Permissions.DeleteCitizens], true) ? (
                      <Button
                        className="ml-2"
                        size="xs"
                        variant="danger"
                        onPress={() => handleDeleteClick(citizen)}
                      >
                        {common("delete")}
                      </Button>
                    ) : null}
                  </>
                ),
              }))}
            columns={[
              { header: tCitizen("fullName"), accessorKey: "name" },
              { header: tCitizen("dateOfBirth"), accessorKey: "dateOfBirth" },
              { header: tCitizen("gender"), accessorKey: "gender" },
              { header: tCitizen("ethnicity"), accessorKey: "ethnicity" },
              { header: tCitizen("hairColor"), accessorKey: "hairColor" },
              { header: tCitizen("eyeColor"), accessorKey: "eyeColor" },
              { header: tCitizen("weight"), accessorKey: "weight" },
              { header: tCitizen("height"), accessorKey: "height" },
              { header: "User", accessorKey: "user" },
              hasPermissions([Permissions.ManageCitizens, Permissions.DeleteCitizens], true)
                ? { header: common("actions"), accessorKey: "actions" }
                : null,
            ]}
          />
        </ul>
      )}

      <Modal
        title={tCitizen("deleteCitizen")}
        onClose={() => closeModal(ModalIds.AlertDeleteCitizen)}
        isOpen={isOpen(ModalIds.AlertDeleteCitizen)}
      >
        <div>
          <p className="my-3">
            {tCitizen.rich("alert_deleteCitizen", {
              citizen: tempValue && `${tempValue.name} ${tempValue.surname}`,
              span: (children) => {
                return <span className="font-semibold">{children}</span>;
              },
            })}
          </p>

          <TextField label="Reason" inputRef={reasonRef} value={reason} onChange={setReason} />
        </div>

        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            variant="cancel"
            disabled={state === "loading"}
            onPress={() => closeModal(ModalIds.AlertDeleteCitizen)}
          >
            {common("cancel")}
          </Button>
          <Button
            disabled={state === "loading"}
            className="flex items-center"
            variant="danger"
            onPress={handleDelete}
          >
            {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
            {common("delete")}
          </Button>
        </div>
      </Modal>
    </>
  );
}

function makeUsersList(citizens: GetManageCitizensData["citizens"]) {
  const list = new Map<string, { id: string; username: string }>();
  const arr = [];

  for (const citizen of citizens) {
    const obj = {
      id: String(citizen.userId),
      username: citizen.user?.username ?? "No User",
    };

    if (list.has(String(citizen.userId))) continue;
    list.set(String(citizen.userId), obj);
    arr.push(obj);
  }

  return arr;
}
