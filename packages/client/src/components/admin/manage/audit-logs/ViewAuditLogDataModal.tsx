import type { AuditLog } from "@snailycad/audit-logger";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";

export function ViewAuditLogDataModal() {
  const { isOpen, closeModal, getPayload } = useModal();
  const auditLog = getPayload<AuditLog>(ModalIds.ViewAuditLogData);

  if (!auditLog) {
    return null;
  }

  return (
    <Modal
      title="Audit Log data"
      className="max-w-[900px]"
      isOpen={isOpen(ModalIds.ViewAuditLogData)}
      onClose={() => closeModal(ModalIds.ViewAuditLogData)}
    >
      <pre className="bg-dark-bright p-3 rounded-md w-[850px]">
        <code className="font-mono">{JSON.stringify(auditLog.action, null, 4)}</code>
      </pre>
    </Modal>
  );
}
