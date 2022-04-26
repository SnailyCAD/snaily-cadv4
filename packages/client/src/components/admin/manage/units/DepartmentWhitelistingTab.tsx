import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import useFetch from "lib/useFetch";
import { formatUnitDivisions, makeUnitName, formatOfficerDepartment } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AlertDeclineOfficerModal } from "./AlertDeclineOfficerModal";
import { useRouter } from "next/router";

interface Props {
  pendingOfficers: Unit[];
  search: string;
}

export function DepartmentWhitelistingTab({ search, pendingOfficers }: Props) {
  const router = useRouter();

  const { openModal, closeModal } = useModal();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const { state, execute } = useFetch();

  async function handleAcceptOrDecline(data: {
    officer: Unit;
    type: "ACCEPT" | "DECLINE";
    action?: string;
    helpers?: any;
  }) {
    const { helpers, officer, ...rest } = data;

    await execute(`/admin/manage/units/departments/${officer.id}`, {
      data: rest,
      helpers,
      method: "POST",
    });

    closeModal(ModalIds.AlertDeclineOfficer);
    router.replace({ pathname: router.pathname, query: router.query });
  }

  return (
    <TabsContent value="departmentWhitelisting">
      {pendingOfficers.length <= 0 ? (
        <p>{t("Management.noPendingOfficers")}</p>
      ) : (
        <Table
          filter={search}
          data={pendingOfficers.map((officer) => ({
            name: makeUnitName(officer),
            callsign: generateCallsign(officer),
            badgeNumber: officer.badgeNumber,
            department: formatOfficerDepartment(officer) ?? common("none"),
            division: formatUnitDivisions(officer),
            actions: (
              <>
                <Button
                  disabled={state === "loading"}
                  onClick={() => handleAcceptOrDecline({ officer, type: "ACCEPT" })}
                  small
                  variant="success"
                >
                  {common("accept")}
                </Button>

                <Button
                  onClick={() => openModal(ModalIds.AlertDeclineOfficer, officer)}
                  disabled={state === "loading"}
                  className="ml-2"
                  small
                  variant="danger"
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: common("name"), accessor: "name" },
            { Header: t("Leo.callsign"), accessor: "callsign" },
            { Header: t("Leo.badgeNumber"), accessor: "badgeNumber" },
            { Header: t("Leo.department"), accessor: "department" },
            { Header: t("Leo.division"), accessor: "division" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <AlertDeclineOfficerModal
        onSubmit={(data) => handleAcceptOrDecline({ ...data, type: "DECLINE" })}
        state={state}
      />
    </TabsContent>
  );
}
