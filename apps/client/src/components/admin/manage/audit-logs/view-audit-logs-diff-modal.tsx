import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import ReactDiffViewer from "react-diff-viewer-continued";
import type { AuditLog } from "@snailycad/types";

export function ViewAuditLogDataModal() {
  const { isOpen, closeModal, getPayload } = useModal();
  const auditLog = getPayload<AuditLog>(ModalIds.ViewAuditLogData);

  if (!auditLog) {
    return null;
  }

  const hasActionData = auditLog.action.previous && auditLog.action.new;

  return (
    <Modal
      title="Audit log diff"
      className="w-full max-w-7xl"
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
      ) : (
        <p>This action log has no data to display.</p>
      )}
    </Modal>
  );
}
