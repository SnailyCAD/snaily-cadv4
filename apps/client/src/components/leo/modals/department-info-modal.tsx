import { Button } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { useLeoState } from "state/leo-state";

import { useEmsFdState } from "state/ems-fd-state";
import { useRouter } from "next/router";
import { Table, useTableState } from "components/shared/Table";

export function DepartmentInformationModal() {
  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const activeEmsFdDeputy = useEmsFdState((state) => state.activeDeputy);

  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const router = useRouter();
  const isLeo = router.pathname.startsWith("/officer");
  const activeUnit = isLeo ? activeOfficer : activeEmsFdDeputy;
  const links = activeUnit?.department?.links ?? [];
  const tableState = useTableState();

  return (
    <Modal
      title={t("departmentInformation")}
      onClose={() => modalState.closeModal(ModalIds.DepartmentInfo)}
      isOpen={modalState.isOpen(ModalIds.DepartmentInfo)}
      className="w-[600px]"
    >
      <p className="text-[17px] max-w-lg dark:text-gray-400 text-neutral-800">
        {t("departmentInformationDesc")}
      </p>

      {links.length <= 0 ? (
        <p className="mt-3 dark:text-gray-400 text-neutral-800 max-w-sm">
          {t("noDepartmentLinks")}
        </p>
      ) : (
        <Table
          features={{ isWithinCardOrModal: true }}
          data={links.map((url) => {
            return {
              id: `${url.url}-${url.id}`,
              name: url.title,
              url: (
                <a
                  className="underline text-blue-400"
                  rel="noreferrer"
                  target="_blank"
                  href={url.url}
                >
                  {url.url}
                </a>
              ),
            };
          })}
          columns={[
            { header: common("name"), accessorKey: "name" },
            { header: common("url"), accessorKey: "url" },
          ]}
          tableState={tableState}
        />
      )}

      <footer className="flex justify-end mt-5">
        <Button
          type="reset"
          onPress={() => modalState.closeModal(ModalIds.DepartmentInfo)}
          variant="cancel"
        >
          {common("cancel")}
        </Button>
      </footer>
    </Modal>
  );
}
