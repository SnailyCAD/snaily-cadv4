import { AlertModal } from "components/modal/AlertModal";
import { useModal } from "state/modalState";
import { useBolos } from "hooks/realtime/useBolos";
import useFetch from "lib/useFetch";
import * as React from "react";
import { ModalIds } from "types/ModalIds";
import { Bolo, BoloType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { ManageBoloModal } from "./ManageBoloModal";
import { BoloColumn } from "./BoloColumn";
import type { DeleteBolosData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useMounted } from "@casper124578/useful";
import { Button } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { Filter } from "react-bootstrap-icons";
import dynamic from "next/dynamic";
import { useBOLOFilters } from "./BoloFilters";

const BoloFilters = dynamic(async () => (await import("./BoloFilters")).BoloFilters, {
  ssr: false,
});

const BOLO_TYPES = Object.values(BoloType);

interface Props {
  initialBolos: Bolo[];
}

export function ActiveBolos({ initialBolos }: Props) {
  const { state, execute } = useFetch();
  const { closeModal } = useModal();
  const bolosState = useBolos();
  const isMounted = useMounted();
  const handleBOLOFilter = useBOLOFilters();
  const bolos = isMounted ? bolosState.bolos : initialBolos;

  const [tempBolo, boloState] = useTemporaryItem(bolos);
  const [showFilters, setShowFilters] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Bolos");

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

  return (
    <div className="mt-3 card">
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-secondary">
        <h1 className="text-xl font-semibold">{t("activeBolos")}</h1>

        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
              showFilters && "dark:!bg-secondary !bg-gray-500",
            )}
            onPress={() => setShowFilters(!showFilters)}
            title={t("filters")}
            disabled={bolos.length <= 0}
          >
            <Filter
              className={classNames("group-hover:fill-white", showFilters && "text-white")}
              aria-label={t("filters")}
            />
          </Button>
        </div>
      </header>

      <div className="px-4">
        {bolos.length <= 0 ? (
          <p className="py-2 text-neutral-700 dark:text-gray-300">{t("noActiveBolos")}</p>
        ) : (
          <>
            {showFilters ? <BoloFilters search={search} setSearch={setSearch} /> : null}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {BOLO_TYPES.map((boloType) => {
                const bolosForType = bolos.filter(
                  (v) => v.type === boloType && handleBOLOFilter(v, search),
                );

                return (
                  <BoloColumn
                    boloType={boloType}
                    setTempBolo={boloState.setTempId}
                    key={boloType}
                    bolos={bolosForType}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* timeout: wait for modal to close */}
      <ManageBoloModal
        onClose={() => setTimeout(() => boloState.setTempId(null), 80)}
        bolo={tempBolo}
      />

      <AlertModal
        title={t("deleteBolo")}
        onDeleteClick={handleDeleteBolo}
        description={t("alert_deleteBolo")}
        id={ModalIds.AlertDeleteBolo}
        onClose={() => boloState.setTempId(null)}
        state={state}
      />
    </div>
  );
}
