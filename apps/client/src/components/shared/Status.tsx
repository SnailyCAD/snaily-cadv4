import {
  LicenseExamStatus,
  ExpungementRequestStatus,
  PaymentStatus,
  WhitelistStatus,
} from "@snailycad/types";
import { useTranslations } from "use-intl";

interface Props {
  children:
    | WhitelistStatus
    | ExpungementRequestStatus
    | LicenseExamStatus
    | PaymentStatus
    | null
    | undefined;
}

enum Colors {
  GREEN = "#3fc89c",
  ORANGE = "#ffb55b",
  RED = "#ff7b82",
}

export function Status({ children }: Props) {
  const colors = {
    [WhitelistStatus.ACCEPTED]: Colors.GREEN,
    [ExpungementRequestStatus.ACCEPTED]: Colors.GREEN,
    [LicenseExamStatus.PASSED]: Colors.GREEN,
    [PaymentStatus.PAID]: Colors.GREEN,
    [WhitelistStatus.PENDING]: Colors.ORANGE,
    [ExpungementRequestStatus.PENDING]: Colors.ORANGE,
    [LicenseExamStatus.IN_PROGRESS]: Colors.ORANGE,
    [WhitelistStatus.DECLINED]: Colors.RED,
    [ExpungementRequestStatus.DENIED]: Colors.RED,
    [LicenseExamStatus.FAILED]: Colors.RED,
    [PaymentStatus.UNPAID]: Colors.RED,
    [ExpungementRequestStatus.CANCELED]: Colors.RED,
  };

  const t = useTranslations("Statuses");

  return (
    <span className="capitalize">
      {children ? (
        <span
          style={{ background: colors[children] }}
          className="inline-block w-2.5 h-2.5 mr-2 rounded-full"
        />
      ) : null}
      {t(children)}
    </span>
  );
}
