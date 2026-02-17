import {
  LicenseExamStatus,
  ExpungementRequestStatus,
  PaymentStatus,
  WhitelistStatus,
} from "@snailycad/types";
import { useTranslations } from "use-intl";

export const ConnectionStatus = {
  CONNECTED: "CONNECTED",
  CONNECTING: "CONNECTING",
  DISCONNECTED: "DISCONNECTED",
};
type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

interface Props {
  children:
    | WhitelistStatus
    | ExpungementRequestStatus
    | LicenseExamStatus
    | PaymentStatus
    | ConnectionStatus
    | null
    | undefined;
  fallback?: string;
}

enum Colors {
  GREEN = "#3fc89c",
  ORANGE = "#ffb55b",
  RED = "#ff7b82",
}

export const colors = {
  ACCEPTED: Colors.GREEN,
  PENDING: Colors.ORANGE,

  [LicenseExamStatus.PASSED]: Colors.GREEN,
  [PaymentStatus.PAID]: Colors.GREEN,
  [ConnectionStatus.CONNECTED]: Colors.GREEN,
  [LicenseExamStatus.IN_PROGRESS]: Colors.ORANGE,
  [ConnectionStatus.CONNECTING]: Colors.ORANGE,
  [WhitelistStatus.DECLINED]: Colors.RED,
  [ExpungementRequestStatus.DENIED]: Colors.RED,
  [LicenseExamStatus.FAILED]: Colors.RED,
  [PaymentStatus.UNPAID]: Colors.RED,
  [ExpungementRequestStatus.CANCELED]: Colors.RED,
  [ConnectionStatus.DISCONNECTED]: Colors.RED,
};

export function Status({ children, fallback }: Props) {
  const t = useTranslations("Statuses");
  const backgroundColor = children && colors[children];

  return (
    <span className="capitalize">
      {backgroundColor ? (
        <span
          style={{ background: colors[children] }}
          className="inline-block w-2.5 h-2.5 mr-2 rounded-full"
        />
      ) : null}
      {children ? t(children) : (fallback ?? "")}
    </span>
  );
}
