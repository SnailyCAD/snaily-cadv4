import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import ReactDiffViewer from "react-diff-viewer-continued";
import type { AuditLog } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { classNames } from "lib/classNames";

export function ViewAuditLogsDiffModal() {
  const { isOpen, closeModal, getPayload } = useModal();
  const auditLog = getPayload<AuditLog>(ModalIds.ViewAuditLogData);
  const t = useTranslations("Management");
  const tAuditLogs = useTranslations("AuditLogs");

  if (!auditLog) {
    return null;
  }

  const hasActionData = auditLog.action.previous && auditLog.action.new;
  const translationKey = auditLog.translationKey;
  const maxWidth = hasActionData ? "max-w-7xl" : "max-w-xl";

  return (
    <Modal
      title={t("auditLogDiff")}
      className={classNames("w-full", maxWidth)}
      isOpen={isOpen(ModalIds.ViewAuditLogData)}
      onClose={() => closeModal(ModalIds.ViewAuditLogData)}
    >
      {hasActionData ? (
        <ReactDiffViewer
          useDarkTheme
          oldValue={JSON.stringify(auditLog.action.previous, null, 4)}
          newValue={JSON.stringify(auditLog.action.new, null, 4)}
          splitView
          disableWordDiff
        />
      ) : translationKey ? (
        <p>
          {tAuditLogs.rich(translationKey, {
            value:
              auditLog.action.new && "id" in auditLog.action.new && auditLog.action.new.id
                ? auditLog.action.new.id
                : "UNKNOWN",
          })}
        </p>
      ) : (
        <p>{t("noAuditLogDiff")}</p>
      )}
    </Modal>
  );
}
