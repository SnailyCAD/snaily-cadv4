import { ExpungementRequestStatus, WhitelistStatus } from "@snailycad/types";

interface Props {
  state: WhitelistStatus | ExpungementRequestStatus | null | undefined;
  children: React.ReactNode;
}

export function Status({ state, children }: Props) {
  const colors = {
    [WhitelistStatus.ACCEPTED]: "#3fc89c",
    [ExpungementRequestStatus.ACCEPTED]: "#3fc89c",
    [WhitelistStatus.PENDING]: "#ffb55b",
    [ExpungementRequestStatus.PENDING]: "#ffb55b",
    [WhitelistStatus.DECLINED]: "#ff7b82",
    [ExpungementRequestStatus.DENIED]: "#ff7b82",
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
