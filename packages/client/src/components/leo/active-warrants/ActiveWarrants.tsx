import * as React from "react";
import type { Warrant } from "@snailycad/types";
import { Button } from "components/Button";
import { Table } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { CreateWarrantModal } from "../modals/CreateWarrantModal";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

export function ActiveWarrants({
  warrants = [{ status: "ACTIVE", id: "1", citizenId: "john doe", description: "hello world" }],
}: {
  warrants: Warrant[];
}) {
  const { state, tempItem: tempWarrant } = useTemporaryItem(warrants);

  const { openModal } = useModal();
  const common = useTranslations("Common");

  function handleEditClick(warrant: Warrant) {
    state.setTempId(warrant.id);
    openModal(ModalIds.CreateWarrant);
  }

  console.log({ tempWarrant });

  return (
    <div className="overflow-hidden rounded-md card mt-3">
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{"warrants"}</h3>
      </header>

      <div className="px-4">
        <Table
          isWithinCard
          data={warrants.map((warrant) => ({
            citizen: "John Doe",
            description: "hello world",
            actions: (
              <>
                <Button onClick={() => handleEditClick(warrant)} size="xs">
                  {common("edit")}
                </Button>
                <Button size="xs" className="ml-2" variant="danger">
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: "Citizen", accessor: "citizen" },
            { Header: common("description"), accessor: "description" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      </div>

      <CreateWarrantModal onClose={() => state.setTempId(null)} warrant={tempWarrant} />
    </div>
  );
}
