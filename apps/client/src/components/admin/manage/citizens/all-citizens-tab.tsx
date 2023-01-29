import * as React from "react";
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
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import type { DeleteManageCitizenByIdData, GetManageCitizensData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import dynamic from "next/dynamic";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});

type CitizenWithUser = GetManageCitizensData["citizens"][number];

interface Props {
  citizens: GetManageCitizensData["citizens"];
  totalCount: number;
  setCitizens: React.Dispatch<React.SetStateAction<GetManageCitizensData["citizens"]>>;
}

export function AllCitizensTab({ citizens: initialData, totalCount, setCitizens }: Props) {
  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    search,
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

  const [tempValue, valueState] = useTemporaryItem(asyncTable.items);
  const users = React.useMemo(() => makeUsersList(asyncTable.items), [asyncTable.items]);
  const { hasPermissions } = usePermission();

  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();

  const tCitizen = useTranslations("Citizen");
  const t = useTranslations("Management");
  const common = useTranslations("Common");

  function handleDeleteClick(value: CitizenWithUser) {
    valueState.setTempId(value.id);
    openModal(ModalIds.AlertDeleteCitizen);
  }

  async function handleDelete() {
    if (!tempValue) return;

    const { json } = await execute<DeleteManageCitizenByIdData>({
      path: `/admin/manage/citizens/${tempValue.id}`,
      method: "DELETE",
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
              onChange={setSearch}
              value={search}
              placeholder="John Doe"
            >
              {asyncTable.isLoading ? (
                <span className="absolute top-[2.4rem] right-2.5">
                  <Loader />
                </span>
              ) : null}
            </TextField>

            <FormField className="w-40" label="Filter">
              <Select
                isClearable
                value={asyncTable.filters?.userId ?? null}
                onChange={(e) =>
                  asyncTable.setFilters((prevFilters) => ({
                    ...prevFilters,
                    userId: e?.target.value,
                  }))
                }
                values={users.map((u) => ({
                  label: u.username,
                  value: u.id,
                }))}
              />
            </FormField>
          </div>

          {search && asyncTable.pagination.totalDataCount !== totalCount ? (
            <p className="italic text-base font-semibold">
              {common.rich("showingXResults", {
                amount: asyncTable.pagination.totalDataCount,
              })}
            </p>
          ) : null}

          <Table
            tableState={tableState}
            data={asyncTable.items.map((citizen) => ({
              id: citizen.id,
              name: `${citizen.name} ${citizen.surname}`,
              dateOfBirth: (
                <FullDate isDateOfBirth onlyDate>
                  {citizen.dateOfBirth}
                </FullDate>
              ),
              gender: citizen.gender?.value ?? common("none"),
              ethnicity: citizen.ethnicity?.value ?? common("none"),
              hairColor: citizen.hairColor,
              eyeColor: citizen.eyeColor,
              weight: citizen.weight,
              height: citizen.height,
              user: citizen.user?.username ?? common("none"),
              actions: (
                <>
                  {hasPermissions([Permissions.ManageCitizens], true) ? (
                    <Link
                      href={`/admin/manage/citizens/${citizen.id}`}
                      className={classNames(buttonVariants.success, "p-0.5 px-2 rounded-md")}
                    >
                      {common("edit")}
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

      <AlertModal
        id={ModalIds.AlertDeleteCitizen}
        title={tCitizen("deleteCitizen")}
        description={tCitizen.rich("alert_deleteCitizen", {
          citizen: tempValue && `${tempValue.name} ${tempValue.surname}`,
        })}
        onDeleteClick={handleDelete}
        state={state}
      />
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
