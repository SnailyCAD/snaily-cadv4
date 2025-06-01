import * as React from "react";
import {
  Button,
  SelectField,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  FullDate,
} from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import type { GetManageUsersInactiveUsers } from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import { toastMessage } from "lib/toastMessage";
import { useTranslations } from "use-intl";

const initialData = {
  totalCount: 0,
  data: [] as GetManageUsersInactiveUsers["users"],
};

export function PruneUsersModal() {
  const [days, setDays] = React.useState("30");
  const { state, execute } = useFetch();
  const t = useTranslations("Management");

  const modalState = useModal();
  const asyncTable = useAsyncTable({
    totalCount: initialData.totalCount,
    initialData: initialData.data,
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

    if (typeof json.count === "number") {
      toastMessage({
        icon: "success",
        title: t("usersPruned"),
        message: t("usersPrunedMessage", { count: json.count }),
      });
      modalState.closeModal(ModalIds.PruneUsers);
    }
  }

  return (
    <Modal
      onClose={() => modalState.closeModal(ModalIds.PruneUsers)}
      className="w-[600px]"
      title={t("pruneUsers")}
      isOpen={modalState.isOpen(ModalIds.PruneUsers)}
    >
      <SelectField
        isDisabled={asyncTable.isLoading}
        onSelectionChange={(value) => {
          setDays(value as string);
          asyncTable.setFilters((prevFilters) => ({ ...prevFilters, days: value as string }));
        }}
        selectedKey={days}
        label={t("lastSeen")}
        options={[
          { label: t("30Days"), value: "30" },
          { label: t("3Months"), value: "90" },
          { label: t("6Months"), value: "180" },
        ]}
      />

      <Accordion className="mt-4" type="multiple">
        <AccordionItem value="unavailable-sounds">
          <AccordionTrigger type="button" title={t("clickToExpand")}>
            <h3 className="text-xl leading-none">{t("inactiveUsers")}</h3>
          </AccordionTrigger>

          <AccordionContent className="mt-3">
            {asyncTable.items.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-base">
                    <span className="font-semibold">{t("lastSeen")}:</span>{" "}
                    <FullDate onlyDate>{user.lastSeen}</FullDate>
                  </p>
                </div>
                <Button type="button" size="xs" onPress={() => asyncTable.remove(user.id)}>
                  {t("keep")}
                </Button>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <footer>
        <Button
          type="button"
          className="mt-4"
          onPress={() => handleSubmit()}
          isDisabled={asyncTable.isLoading || state === "loading"}
        >
          {t("pruneUsers")}
        </Button>
      </footer>
    </Modal>
  );
}
