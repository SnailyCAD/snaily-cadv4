import * as React from "react";
import { useModal } from "state/modalState";
import { useBolos } from "hooks/realtime/useBolos";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { type Bolo, Rank, ShouldDoType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import type { DeleteBolosData, GetBolosData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useMounted } from "@casper124578/useful";
import { Button } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { Filter } from "react-bootstrap-icons";
import dynamic from "next/dynamic";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { useLeoState } from "state/leo-state";
import { useRouter } from "next/router";
import { usePermission } from "hooks/usePermission";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { defaultPermissions } from "@snailycad/permissions";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { FullDate } from "components/shared/FullDate";

const BoloFilters = dynamic(async () => (await import("./bolo-filters")).BoloFilters, {
  ssr: false,
});

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});

const ManageBoloModal = dynamic(async () => (await import("./manage-bolo-modal")).ManageBoloModal, {
  ssr: false,
});

interface Props {
  initialBolos: GetBolosData;
}

const STOLEN_TEXT = "stolen" as const;

export function ActiveBolos({ initialBolos }: Props) {
  const [showFilters, setShowFilters] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { state, execute } = useFetch();
  const { closeModal, openModal } = useModal();
  const bolosState = useBolos();
  const isMounted = useMounted();
  const bolos = isMounted ? bolosState.bolos : initialBolos.bolos;
  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();

  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const { pathname } = useRouter();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(
    defaultPermissions.allDefaultAdminPermissions,
    (u) => u.rank !== Rank.USER,
  );

  const isDispatchRoute = pathname === "/dispatch";
  const isDisabled = isAdmin
    ? false
    : isDispatchRoute
    ? !hasActiveDispatchers
    : !activeOfficer || activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY;

  const asyncTable = useAsyncTable({
    search,
    scrollToTopOnDataChange: false,
    fetchOptions: {
      onResponse: (data: GetBolosData) => ({
        data: data.bolos,
        totalCount: data.totalCount,
      }),
      path: "/bolos",
      pageSize: 12,
    },
    totalCount: initialBolos.totalCount,
    initialData: initialBolos.bolos,
  });
  const tableState = useTableState({ tableId: "active-bolos", pagination: asyncTable.pagination });
  const [tempBolo, boloState] = useTemporaryItem(bolos);

  React.useEffect(() => {
    bolosState.setBolos(asyncTable.items);
  }, [asyncTable.items]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDeleteBolo() {
    if (!tempBolo) return;

    const { json } = await execute<DeleteBolosData>({
      path: `/bolos/${tempBolo.id}`,
      method: "DELETE",
    });

    if (json) {
      bolosState.setBolos(bolos.filter((v) => v.id !== tempBolo.id));

      boloState.setTempId(null);
      closeModal(ModalIds.AlertDeleteBolo);
    }
  }

  function handleEditClick(bolo: Bolo) {
    boloState.setTempId(bolo.id);
    openModal(ModalIds.ManageBolo);
  }

  function handleDeleteClick(bolo: Bolo) {
    boloState.setTempId(bolo.id);
    openModal(ModalIds.AlertDeleteBolo);
  }

  return (
    <div className="mt-3 card">
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-secondary">
        <h3 className="text-xl font-semibold">{t("Bolos.activeBolos")}</h3>

        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
              showFilters && "dark:!bg-secondary !bg-gray-500",
            )}
            onPress={() => setShowFilters(!showFilters)}
            title={t("Bolos.filters")}
            disabled={asyncTable.items.length <= 0}
          >
            <Filter
              className={classNames("group-hover:fill-white", showFilters && "text-white")}
              aria-label={t("Bolos.filters")}
            />
          </Button>
        </div>
      </header>

      {showFilters ? <BoloFilters asyncTable={asyncTable} search={{ search, setSearch }} /> : null}

      <div className="px-4">
        {asyncTable.items.length <= 0 ? (
          <p className="py-2 text-neutral-700 dark:text-gray-300">{t("Bolos.noActiveBolos")}</p>
        ) : (
          <Table
            features={{ isWithinCardOrModal: true }}
            tableState={tableState}
            data={bolos.map((bolo) => {
              const isBoloMarkedForStolen = bolo.description === STOLEN_TEXT;
              const descriptionData = isBoloMarkedForStolen
                ? { description: t("Bolos.stolen") }
                : { description: bolo.description };

              return {
                id: bolo.id,
                type: <span className="capitalize">{bolo.type.toLowerCase()}</span>,
                name: bolo.name,
                model: bolo.model || "—",
                plate: bolo.plate || "—",
                color: bolo.color || "—",
                description: <CallDescription data={descriptionData} />,
                createdAt: <FullDate>{bolo.createdAt}</FullDate>,
                officer: bolo.officer
                  ? `${generateCallsign(bolo.officer)} ${makeUnitName(bolo.officer)}`
                  : t("Leo.dispatch"),
                actions: (
                  <>
                    <Button
                      size="xs"
                      disabled={isDisabled}
                      onPress={() => handleEditClick(bolo)}
                      variant="success"
                    >
                      {common("edit")}
                    </Button>
                    <Button
                      size="xs"
                      className="ml-2"
                      disabled={isDisabled}
                      onPress={() => handleDeleteClick(bolo)}
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  </>
                ),
              };
            })}
            columns={[
              { header: common("type"), accessorKey: "type" },
              { header: common("name"), accessorKey: "name" },
              { header: t("Leo.model"), accessorKey: "model" },
              { header: t("Leo.plate"), accessorKey: "plate" },
              { header: t("Leo.color"), accessorKey: "color" },
              { header: t("Leo.officer"), accessorKey: "officer" },
              { header: common("description"), accessorKey: "description" },
              { header: common("createdAt"), accessorKey: "createdAt" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        )}
      </div>

      {/* timeout: wait for modal to close */}
      <ManageBoloModal
        onClose={() => setTimeout(() => boloState.setTempId(null), 80)}
        bolo={tempBolo}
      />

      <AlertModal
        title={t("Bolos.deleteBolo")}
        onDeleteClick={handleDeleteBolo}
        description={t("Bolos.alert_deleteBolo")}
        id={ModalIds.AlertDeleteBolo}
        onClose={() => boloState.setTempId(null)}
        state={state}
      />
    </div>
  );
}
