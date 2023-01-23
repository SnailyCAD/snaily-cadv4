import type { GetManageUserByIdData } from "@snailycad/types/api";
import { FullDate } from "components/shared/FullDate";
import { Infofield } from "components/shared/Infofield";
import { Table, useTableState } from "components/shared/Table";

interface Props {
  user: GetManageUserByIdData;
}

export function ApiTokenArea({ user }: Props) {
  const tableState = useTableState();

  return (
    <div className="p-4 mt-10 rounded-md card">
      <h1 className="text-2xl font-semibold">API Token</h1>

      {user.apiToken ? (
        <div className="mt-2">
          <Infofield label="Uses">{String(user.apiToken.uses ?? 0)}</Infofield>
          <Infofield label="Created At">
            <FullDate>{user.apiToken.createdAt}</FullDate>
          </Infofield>

          {!user.apiToken.logs.length ? null : (
            <Table
              features={{ isWithinCardOrModal: true }}
              tableState={tableState}
              data={user.apiToken.logs.map((log) => ({
                id: log.id,
                route: (
                  <span className="font-mono">
                    <span className="font-semibold">{log.method}</span> {log.route}
                  </span>
                ),
                createdAt: <FullDate>{log.createdAt}</FullDate>,
              }))}
              columns={[
                { header: "Route", accessorKey: "route" },
                { header: "Created At", accessorKey: "createdAt" },
              ]}
            />
          )}
        </div>
      ) : (
        <p className="text-neutral-700 dark:text-gray-400 mt-2">User has no API Token set.</p>
      )}
    </div>
  );
}
