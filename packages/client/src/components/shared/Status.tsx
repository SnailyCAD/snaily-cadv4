import { ExpungementRequestStatus, WhitelistStatus } from "@snailycad/types";

interface Props {
  state: WhitelistStatus | ExpungementRequestStatus | null | undefined;
  children: React.ReactNode;
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
    [WhitelistStatus.PENDING]: Colors.ORANGE,
    [ExpungementRequestStatus.PENDING]: Colors.ORANGE,
    [WhitelistStatus.DECLINED]: Colors.RED,
    [ExpungementRequestStatus.DENIED]: Colors.RED,
  };

  return (
    <span className="capitalize">
      {state ? (
        <span
          style={{ background: colors[state] }}
          className="inline-block w-2.5 h-2.5 mr-2 rounded-full"
        />
      ) : null}
      {children}
    </span>
  );
}
