import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import prettyBytes from "pretty-bytes";
import { useTranslations } from "next-intl";
import { Title } from "components/shared/Title";
import { defaultPermissions } from "@snailycad/permissions";
import { Rank } from "@snailycad/types";
import type { GetAdminDashboardData } from "@snailycad/types/api";

interface Props {
  counts: GetAdminDashboardData | null;
}

export default function Admin({ counts }: Props) {
  const t = useTranslations("Management");

  if (!counts) {
    return null;
  }

  return (
    <AdminLayout
      permissions={{
        permissions: defaultPermissions.allDefaultAdminPermissions,
        fallback: (u) => u.rank !== Rank.USER,
      }}
    >
      <Title>{t("adminDashboard")}</Title>

      <Group name="Users">
        <Item count={counts.activeUsers} name="active" />
        <Item count={counts.pendingUsers} name="pending" />
        <Item count={counts.bannedUsers} name="banned" />
      </Group>

      <Group name="Citizens">
        <Item count={counts.createdCitizens} name="created" />
        <Item
          count={counts.citizensInBolo}
          name={t("inBolo")}
          percentage={(100 / counts.createdCitizens) * counts.citizensInBolo}
        />
        <Item
          count={counts.arrestCitizens}
          name="arrested"
          percentage={(100 / counts.createdCitizens) * counts.arrestCitizens}
        />
        <Item
          count={counts.deadCitizens}
          name="dead"
          percentage={(100 / counts.createdCitizens) * counts.deadCitizens}
        />
      </Group>

      <Group name="Vehicles">
        <Item count={counts.vehicles} name="registered" />
        <Item
          count={counts.vehiclesInBOLO}
          name={t("inBolo")}
          percentage={(100 / counts.vehicles) * counts.vehiclesInBOLO}
        />
        <Item
          count={counts.impoundedVehicles}
          name="impounded"
          percentage={(100 / counts.vehicles) * counts.impoundedVehicles}
        />
      </Group>

      <Group name="Images">
        <Item count={counts.imageData.count} name="total" />
        <Item count={prettyBytes(counts.imageData.totalSize, { binary: true })} name="" />
      </Group>
    </AdminLayout>
  );
}

function Group({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section className="max-w-2xl my-2 mb-7 select-none">
      <h4 className="text-lg">{name}</h4>

      <div className="flex justify-between">{children}</div>
    </section>
  );
}

function Item({
  count,
  name,
  percentage,
}: {
  count: number | string;
  name: string;
  percentage?: number;
}) {
  return (
    <div className="relative flex items-end select-none">
      <div>
        <span className="font-sans text-5xl font-semibold">{count}</span>
      </div>

      <div className="flex flex-col items-end">
        {percentage ? (
          <span className="text-lg text-gray-500 dark:text-gray-300">{percentage.toFixed()}%</span>
        ) : null}
        <span className="ml-3 text-xl capitalize">{name}</span>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/admin", null]]);

  return {
    props: {
      counts: data,
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};
