import { Button, TabsContent } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { SeizedItemsTable } from "./seized-items-table";

interface SeizedItemsTabProps {
  isReadOnly?: boolean;
}

export function SeizedItemsTab(props: SeizedItemsTabProps) {
  const t = useTranslations("Leo");
  const modalState = useModal();

  return (
    <TabsContent value="seized-items-tab">
      <header className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("seizedItems")}</h3>

        <Button
          type="button"
          onPress={() => modalState.openModal(ModalIds.ManageSeizedItems)}
          disabled={props.isReadOnly}
        >
          {t("add")}
        </Button>
      </header>

      <SeizedItemsTable isReadOnly={props.isReadOnly} />
    </TabsContent>
  );
}
