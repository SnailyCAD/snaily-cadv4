import * as React from "react";
import { Button, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import * as Accordion from "@radix-ui/react-accordion";
import { CaretDownFill } from "react-bootstrap-icons";
import type { GetManageUsersInactiveUsers } from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import { toastMessage } from "lib/toastMessage";

export function PruneUsersModal() {
  const [days, setDays] = React.useState("30");
  const { state, execute } = useFetch();

  const { isOpen, closeModal } = useModal();
  const asyncTable = useAsyncTable({
    totalCount: 0,
    initialData: [] as GetManageUsersInactiveUsers["users"],
    fetchOptions: {
      path: "/admin/manage/users/prune",
      onResponse: (json: GetManageUsersInactiveUsers) => ({
        data: json.users,
        totalCount: json.totalCount,
      }),
    },
  });

  async function handleSubmit() {
    const userIds = asyncTable.items.map((user) => user.id);

    const { json } = await execute<{ count: number }>({
      path: "/admin/manage/users/prune",
      method: "DELETE",
      data: {
        days,
        userIds,
      },
    });

    if (json) {
      toastMessage({
        icon: "success",
        title: "Users Pruned",
        message: `Pruned ${json.count} users`,
      });
      closeModal(ModalIds.PruneUsers);
    }
  }

  return (
    <Modal
      onClose={() => closeModal(ModalIds.PruneUsers)}
      className="w-[600px]"
      title="Prune Users"
      isOpen={isOpen(ModalIds.PruneUsers)}
    >
      <SelectField
        isDisabled={asyncTable.isLoading}
        onSelectionChange={(value) => {
          setDays(value as string);
          asyncTable.setFilters((prevFilters) => ({ ...prevFilters, days: value as string }));
        }}
        selectedKey={days}
        label="Last Seen"
        options={[
          { label: "30 Days", value: "30" },
          { label: "3 Months", value: "90" },
          { label: "6 Months", value: "180" },
        ]}
      />

      <Accordion.Root disabled={asyncTable.items.length <= 0} className="mt-4" type="multiple">
        <Accordion.Item value="unavailable-sounds">
          <Accordion.Trigger
            type="button"
            title="Click to expand"
            className="accordion-state gap-2 flex items-center justify-between pt-1 text-lg font-semibold text-left"
          >
            <h3 className="text-xl font-semibold leading-none">Inactive Users</h3>

            <CaretDownFill
              width={16}
              height={16}
              className="transform w-4 h-4 transition-transform accordion-state-transform"
            />
          </Accordion.Trigger>

          <Accordion.Content className="mt-3">
            {asyncTable.items.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <span className="font-semibold">{user.username}</span>
                <Button type="button" size="xs" onPress={() => asyncTable.remove(user.id)}>
                  Keep
                </Button>
              </div>
            ))}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <footer>
        <Button
          type="button"
          className="mt-4"
          onPress={() => handleSubmit()}
          isDisabled={asyncTable.isLoading || state === "loading"}
        >
          Prune Users
        </Button>
      </footer>
    </Modal>
  );
}
