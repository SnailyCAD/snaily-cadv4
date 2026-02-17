import * as React from "react";
import { DashboardLayoutCardType } from "@snailycad/types";
import { Modal } from "components/modal/Modal";
import { useRouter } from "next/router";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { ReactSortable } from "react-sortablejs";
import { ArrowsMove } from "react-bootstrap-icons";
import { useAuth } from "context/AuthContext";
import { Button, Loader } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";
import { toastMessage } from "lib/toastMessage";

const cardTypes: Record<"ems-fd" | "officer" | "dispatch", DashboardLayoutCardType[]> = {
  "ems-fd": [
    DashboardLayoutCardType.ACTIVE_CALLS,
    DashboardLayoutCardType.ACTIVE_DEPUTIES,
    DashboardLayoutCardType.ACTIVE_OFFICERS,
  ],
  officer: [
    DashboardLayoutCardType.ACTIVE_CALLS,
    DashboardLayoutCardType.ACTIVE_BOLOS,
    DashboardLayoutCardType.ACTIVE_WARRANTS,
    DashboardLayoutCardType.ACTIVE_OFFICERS,
    DashboardLayoutCardType.ACTIVE_DEPUTIES,
    DashboardLayoutCardType.ACTIVE_INCIDENTS,
  ],
  dispatch: [
    DashboardLayoutCardType.ACTIVE_OFFICERS,
    DashboardLayoutCardType.ACTIVE_DEPUTIES,
    DashboardLayoutCardType.ACTIVE_CALLS,
    DashboardLayoutCardType.ACTIVE_INCIDENTS,
    DashboardLayoutCardType.ACTIVE_BOLOS,
  ],
};

export function EditDashboardLayoutModal() {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  const { setUser, user } = useAuth();
  const [sortedList, setSortedList] = React.useState<DashboardLayoutCardType[]>([]);

  const modalState = useModal();
  const router = useRouter();
  const type = getCardsType(router.pathname);
  const columnName = getColumnName(type);
  const { execute, state } = useFetch();

  const cardsForType = cardTypes[type];

  function handleListChange(list: { id: DashboardLayoutCardType }[]) {
    setSortedList(list.map((l) => l.id));
  }

  async function handleSave() {
    if (sortedList.length <= 0) return;
    if (!user || !columnName) return;

    const { json } = await execute({
      method: "PUT",
      path: "/user/dashboard-layout",
      data: {
        type: columnName,
        layout: sortedList,
      },
    });

    if (json) {
      setUser({ ...user, [columnName]: sortedList });
      toastMessage({
        icon: "success",
        title: t("layoutSavedTitle"),
        message: t("layoutSavedMessage"),
      });
    }
  }

  React.useEffect(() => {
    const userSortedList = columnName ? (user?.[columnName] ?? []) : [];

    const list = cardsForType.sort((a, b) => {
      return userSortedList.indexOf(a) - userSortedList.indexOf(b);
    });

    setSortedList(list);
  }, [cardsForType, columnName, user]);

  return (
    <Modal
      title={t("editDashboardLayout")}
      isOpen={modalState.isOpen(ModalIds.EditDashboardLayout)}
      onClose={() => modalState.closeModal(ModalIds.EditDashboardLayout)}
      className="w-[650px]"
    >
      <ReactSortable
        animation={200}
        tag="ul"
        setList={handleListChange}
        list={sortedList.map((type) => ({ id: type }))}
        className="flex flex-col gap-y-2 mt-5"
      >
        {sortedList.map((type) => (
          <li
            className="card border-2 rounded-md p-4 cursor-pointer flex items-center justify-between"
            key={type}
          >
            {t(type)}

            <ArrowsMove />
          </li>
        ))}
      </ReactSortable>

      <footer className="flex items-center justify-end mt-3">
        <Button
          type="button"
          className="flex items-center gap-2"
          isDisabled={state === "loading"}
          onPress={handleSave}
        >
          {state === "loading" ? <Loader /> : null}
          {common("save")}
        </Button>
      </footer>
    </Modal>
  );
}

function getCardsType(pathname: string) {
  if (pathname.includes("/dispatch")) {
    return "dispatch";
  }

  if (pathname.includes("/officer")) {
    return "officer";
  }

  return "ems-fd";
}

function getColumnName(type: "ems-fd" | "officer" | "dispatch") {
  switch (type) {
    case "ems-fd": {
      return "emsFdLayoutOrder";
    }
    case "officer": {
      return "officerLayoutOrder";
    }
    case "dispatch": {
      return "dispatchLayoutOrder";
    }
    default: {
      return null;
    }
  }
}
