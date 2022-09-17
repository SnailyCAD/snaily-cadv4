import {
  DLExamStatus,
  ExpungementRequestStatus,
  PaymentStatus,
  WhitelistStatus,
} from "@snailycad/types";

interface Props {
  state:
    | WhitelistStatus
    | ExpungementRequestStatus
    | DLExamStatus
    | PaymentStatus
    | null
    | undefined;
  children: string | null | undefined;
}

enum Colors {
  GREEN = "#3fc89c",
  ORANGE = "#ffb55b",
  RED = "#ff7b82",
}

export function Status({ state, children }: Props) {
  const colors = {
    [WhitelistStatus.ACCEPTED]: Colors.GREEN,
    [ExpungementRequestStatus.ACCEPTED]: Colors.GREEN,
    [DLExamStatus.PASSED]: Colors.GREEN,
    [PaymentStatus.PAID]: Colors.GREEN,
    [WhitelistStatus.PENDING]: Colors.ORANGE,
    [ExpungementRequestStatus.PENDING]: Colors.ORANGE,
    [DLExamStatus.IN_PROGRESS]: Colors.ORANGE,
    [WhitelistStatus.DECLINED]: Colors.RED,
    [ExpungementRequestStatus.DENIED]: Colors.RED,
    [DLExamStatus.FAILED]: Colors.RED,
    [PaymentStatus.UNPAID]: Colors.RED,
  };

  const text = !children ? "" : children.toLowerCase().replace(/_/g, " ");

  console.log({ state });

  return (
    <span className="capitalize">
      {state ? (
        <span
          style={{ background: colors[state] }}
          className="inline-block w-2.5 h-2.5 mr-2 rounded-full"
        />
      ) : null}
      {text}
    </span>
  );
}
