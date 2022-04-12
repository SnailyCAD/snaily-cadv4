import compareDesc from "date-fns/compareDesc";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useNameSearch } from "state/search/nameSearchState";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table } from "components/shared/Table";
import { Select } from "components/form/Select";
import { FullDate } from "components/shared/FullDate";
import type { Warrant } from "@snailycad/types";
import { TabsContent } from "components/shared/TabList";

const values = [
  { label: "Inactive", value: "inactive" },
  { label: "Active", value: "active" },
];

export function NameSearchWarrantsTab() {
  const common = useTranslations("Common");
  const { openModal, closeModal, getPayload } = useModal();
  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const { state, execute } = useFetch();
  const { currentResult, setCurrentResult } = useNameSearch();

  async function handleDelete() {
    const warrant = getPayload<Warrant>(ModalIds.AlertRevokeWarrant);
    if (!warrant) return;

    const { json } = await execute(`/records/${warrant.id}`, {
      data: { type: "WARRANT" },
      method: "DELETE",
    });

    if (json) {
      if (currentResult) {
        setCurrentResult({
          ...currentResult,
          warrants: currentResult.warrants.filter((v) => v.id !== warrant.id),
        });
      }

      closeModal(ModalIds.AlertRevokeWarrant);
    }
  }

  function handleDeleteClick(warrant: Warrant) {
    openModal(ModalIds.AlertRevokeWarrant, warrant);
  }

  async function handleChange(value: string, warrant: Warrant) {
    const { json } = await execute(`/records/warrant/${warrant.id}`, {
      data: { status: value.toUpperCase(), type: "WARRANT" },
      method: "PUT",
    });

    if (json && currentResult) {
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

  if (!currentResult) {
    return null;
  }

  return (
    <TabsContent className="mt-3" value="warrants">
      <h3 className="text-xl font-semibold">{t("Leo.warrants")}</h3>

      {currentResult.warrants.length <= 0 ? (
        <p className="text-gray-400 my-2">{t("Leo.noWarrants")}</p>
      ) : (
        <>
          <Table
            data={currentResult.warrants
              .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
              .map((warrant) => {
                const value = values.find((v) => v.value === warrant.status.toLowerCase());

                return {
                  officer: `${generateCallsign(warrant.officer)} ${makeUnitName(warrant.officer)}`,
                  description: warrant.description,
                  createdAt: <FullDate>{warrant.createdAt}</FullDate>,
                  actions: (
                    <div className="flex gap-2">
                      <Select
                        onChange={(e) => handleChange(e.target.value, warrant)}
                        className="w-40"
                        values={values}
                        value={value ?? null}
                      />
                      <Button
                        type="button"
                        onClick={() => handleDeleteClick(warrant)}
                        small
                        variant="danger"
                      >
                        {t("Leo.revoke")}
                      </Button>
                    </div>
                  ),
                };
              })}
            columns={[
              { Header: t("Leo.officer"), accessor: "officer" },
              { Header: common("description"), accessor: "description" },
              { Header: common("createdAt"), accessor: "createdAt" },
              { Header: common("actions"), accessor: "actions" },
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
