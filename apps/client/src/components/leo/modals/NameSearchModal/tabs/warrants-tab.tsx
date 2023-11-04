import compareDesc from "date-fns/compareDesc";
import { useTranslations } from "use-intl";
import { SelectField, Button, TabsContent, FullDate } from "@snailycad/ui";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useNameSearch } from "state/search/name-search-state";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useTableState } from "components/shared/Table";
import { type Warrant, WarrantStatus } from "@snailycad/types";
import type { DeleteRecordsByIdData, PutWarrantsData } from "@snailycad/types/api";
import { Permissions, usePermission } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

const values = [
  { label: "Inactive", value: WarrantStatus.INACTIVE },
  { label: "Active", value: WarrantStatus.ACTIVE },
];

export function NameSearchWarrantsTab() {
  const common = useTranslations("Common");
  const modalState = useModal();
  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const { state, execute } = useFetch();
  const { currentResult, setCurrentResult } = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));
  const tableState = useTableState();
  const { WARRANT_STATUS_APPROVAL } = useFeatureEnabled();

  const { hasPermissions } = usePermission();
  const hasManageWarrantsPermissions = hasPermissions([Permissions.ManageWarrants]);
  const hasManagePendingWarrantsPermissions = hasPermissions([Permissions.ManagePendingWarrants]);

  const hasManagePermissions = WARRANT_STATUS_APPROVAL
    ? hasManagePendingWarrantsPermissions
    : hasManageWarrantsPermissions;

  async function handleDelete() {
    const warrant = modalState.getPayload<Warrant>(ModalIds.AlertRevokeWarrant);
    if (!warrant) return;
    if (!currentResult || currentResult.isConfidential) return;

    const { json } = await execute<DeleteRecordsByIdData>({
      path: `/records/${warrant.id}`,
      data: { type: "WARRANT" },
      method: "DELETE",
    });

    if (json) {
      setCurrentResult({
        ...currentResult,
        warrants: currentResult.warrants.filter((v) => v.id !== warrant.id),
      });
      modalState.closeModal(ModalIds.AlertRevokeWarrant);
    }
  }

  function handleDeleteClick(warrant: Warrant) {
    modalState.openModal(ModalIds.AlertRevokeWarrant, warrant);
  }

  async function handleChange(value: string, warrant: Warrant) {
    if (!currentResult || currentResult.isConfidential) return;

    const { json } = await execute<PutWarrantsData>({
      path: `/records/warrant/${warrant.id}`,
      data: { status: value.toUpperCase(), type: "WARRANT" },
      method: "PUT",
    });

    if (json) {
      setCurrentResult({
        ...currentResult,
        warrants: currentResult.warrants.map((v) => {
          if (v.id === warrant.id) {
            return { ...v, ...json };
          }

          return v;
        }),
      });
    }
  }

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  return (
    <TabsContent className="mt-3" value="warrants">
      <h3 className="text-xl font-semibold">{t("Leo.warrants")}</h3>

      {currentResult.warrants.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 my-2">{t("Leo.noWarrants")}</p>
      ) : (
        <>
          <Table
            features={{ isWithinCardOrModal: true }}
            tableState={tableState}
            data={currentResult.warrants
              .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
              .map((warrant) => {
                return {
                  id: warrant.id,
                  officer: warrant.officer
                    ? `${generateCallsign(warrant.officer)} ${makeUnitName(warrant.officer)}`
                    : "—",
                  description: <CallDescription data={warrant} />,
                  createdAt: <FullDate>{warrant.createdAt}</FullDate>,
                  status: warrant.status,
                  actions: hasManageWarrantsPermissions ? (
                    <div className="flex gap-2">
                      {hasManagePermissions ? (
                        <SelectField
                          hiddenLabel
                          label={t("Leo.status")}
                          onSelectionChange={(value) => handleChange(value as string, warrant)}
                          className="w-40"
                          options={values}
                          selectedKey={warrant.status ?? null}
                        />
                      ) : null}
                      <Button
                        type="button"
                        onPress={() => handleDeleteClick(warrant)}
                        size="xs"
                        variant="danger"
                      >
                        {t("Leo.revoke")}
                      </Button>
                    </div>
                  ) : null,
                };
              })}
            columns={[
              { header: t("Leo.officer"), accessorKey: "officer" },
              { header: common("description"), accessorKey: "description" },
              { header: common("createdAt"), accessorKey: "createdAt" },
              hasManagePermissions ? null : { header: t("Leo.status"), accessorKey: "status" },
              hasManageWarrantsPermissions
                ? { header: common("actions"), accessorKey: "actions" }
                : null,
            ]}
          />

          <AlertModal
            id={ModalIds.AlertRevokeWarrant}
            onDeleteClick={handleDelete}
            description={t("Leo.alert_revokeWarrant")}
            title={t("Leo.revokeWarrant")}
            deleteText={t("Leo.revoke")}
            state={state}
          />
        </>
      )}
    </TabsContent>
  );
}
