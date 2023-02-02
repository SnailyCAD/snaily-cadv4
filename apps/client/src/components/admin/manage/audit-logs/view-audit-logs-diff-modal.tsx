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

  const translationKey = auditLog.translationKey;
  const hasActionData =
    (auditLog.action.new && !translationKey) || (auditLog.action.previous && auditLog.action.new);
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
            value: parseAuditLogData(auditLog),
          })}
        </p>
      ) : (
        <p>{t("noAuditLogDiff")}</p>
      )}
    </Modal>
  );
}

function parseAuditLogData(auditLog: any) {
  try {
    if (auditLog.action.new && "id" in auditLog.action.new && auditLog.action.new.id) {
      return auditLog.action.new.id;
    }

    if (typeof auditLog.action.new === "string") {
      return auditLog.action.new;
    }

    if (Array.isArray(auditLog.action.new)) {
      return auditLog.action.new.join(", ");
    }
  } catch (e) {
    return "UNKNOWN";
  }
}
