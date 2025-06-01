import * as React from "react";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import {
  Loader,
  Button,
  buttonVariants,
  TextField,
  FullDate,
  AsyncListSearchField,
  Item,
} from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { Table, useTableState } from "components/shared/Table";
import Link from "next/link";
import { usePermission, Permissions } from "hooks/usePermission";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import type { DeleteManageCitizenByIdData, GetManageCitizensData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import dynamic from "next/dynamic";
import type { User } from "@snailycad/types";

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
    sortingSchema: {
      name: "name",
      surname: "surname",
      dateOfBirth: "dateOfBirth",
      gender: "gender.value",
      ethnicity: "ethnicity.value",
      hairColor: "hairColor",
      eyeColor: "eyeColor",
      weight: "weight",
      height: "height",
      user: "user.username",
    },
    fetchOptions: {
      path: "/admin/manage/citizens",
      onResponse: (json: GetManageCitizensData) => ({
        totalCount: json.totalCount,
        data: json.citizens,
      }),
    },
  });
  const tableState = useTableState({
    sorting: asyncTable.sorting,
    pagination: asyncTable.pagination,
  });

  const [tempValue, valueState] = useTemporaryItem(asyncTable.items);
  const { hasPermissions } = usePermission();
  const hasViewUsersPermissions = hasPermissions([Permissions.ViewUsers]);

  const { state, execute } = useFetch();
  const modalState = useModal();

  const tCitizen = useTranslations("Citizen");
  const t = useTranslations("Management");
  const common = useTranslations("Common");

  function handleDeleteClick(value: CitizenWithUser) {
    valueState.setTempId(value.id);
    modalState.openModal(ModalIds.AlertDeleteCitizen);
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
      modalState.closeModal(ModalIds.AlertDeleteCitizen);
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

            <AsyncListSearchField<User>
              isClearable
              onInputChange={(value) =>
                asyncTable.setFilters((prevFilters) => ({
                  ...prevFilters,
                  username: value,
                }))
              }
              onSelectionChange={(node) => {
                asyncTable.setFilters((prevFilters) => ({
                  ...prevFilters,
                  userId: node?.value?.id,
                }));
              }}
              localValue={asyncTable.filters?.username ?? ""}
              label="User"
              selectedKey={asyncTable.filters?.userId ?? null}
              fetchOptions={{
                apiPath: "/admin/manage/users/search",
                method: "POST",
                bodyKey: "username",
              }}
            >
              {(item) => (
                <Item key={item.id} textValue={item.username}>
                  <p>{item.username}</p>
                </Item>
              )}
            </AsyncListSearchField>
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
              name: citizen.name,
              surname: citizen.surname,
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
              user:
                hasViewUsersPermissions && citizen.user ? (
                  <Link
                    href={`/admin/manage/users/${citizen.userId}`}
                    className={buttonVariants({ size: "xs" })}
                  >
                    {citizen.user.username}
                  </Link>
                ) : (
                  common("none")
                ),
              actions: (
                <>
                  {hasPermissions([Permissions.ManageCitizens]) ? (
                    <Link
                      href={`/admin/manage/citizens/${citizen.id}`}
                      className={buttonVariants({ variant: "success", size: "xs" })}
                    >
                      {common("edit")}
                    </Link>
                  ) : null}
                  {hasPermissions([Permissions.DeleteCitizens]) ? (
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
              { header: tCitizen("name"), accessorKey: "name" },
              { header: tCitizen("surname"), accessorKey: "surname" },
              { header: tCitizen("dateOfBirth"), accessorKey: "dateOfBirth" },
              { header: tCitizen("gender"), accessorKey: "gender" },
              { header: tCitizen("ethnicity"), accessorKey: "ethnicity" },
              { header: tCitizen("hairColor"), accessorKey: "hairColor" },
              { header: tCitizen("eyeColor"), accessorKey: "eyeColor" },
              { header: tCitizen("weight"), accessorKey: "weight" },
              { header: tCitizen("height"), accessorKey: "height" },
              { header: "User", accessorKey: "user" },
              hasPermissions([Permissions.ManageCitizens, Permissions.DeleteCitizens])
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
