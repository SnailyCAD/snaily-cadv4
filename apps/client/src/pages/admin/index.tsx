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
        permissions: [
          ...defaultPermissions.allDefaultAdminPermissions,
          ...defaultPermissions.defaultCourthousePermissions,
        ],
        fallback: (u) => u.rank !== Rank.USER,
      }}
    >
      <Title>{t("adminDashboard")}</Title>

      <Group name={t("users")}>
        <Item count={counts.activeUsers} name={t("active")} />
        <Item count={counts.pendingUsers} name={t("pending")} />
        <Item count={counts.bannedUsers} name={t("banned")} />
      </Group>

      <Group name={t("citizens")}>
        <Item count={counts.createdCitizens} name={t("created")} />
        <Item
          count={counts.citizensInBolo}
          name={t("inBolo")}
          percentage={(100 / counts.createdCitizens) * counts.citizensInBolo}
        />
        <Item
          count={counts.arrestCitizens}
          name={t("arrested")}
          percentage={(100 / counts.createdCitizens) * counts.arrestCitizens}
        />
        <Item
          count={counts.deadCitizens}
          name={t("dead")}
          percentage={(100 / counts.createdCitizens) * counts.deadCitizens}
        />
      </Group>

      <Group name={t("vehicles")}>
        <Item count={counts.vehicles} name={t("registered")} />
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

      <Group name={t("leo")}>
        <Item count={counts.officerCount} name="total" />
        <Item
          count={counts.onDutyOfficers}
          name={t("onDuty")}
          percentage={(100 / counts.officerCount) * counts.onDutyOfficers}
        />
        <Item
          count={counts.suspendedOfficers}
          name={t("suspended")}
          percentage={(100 / counts.officerCount) * counts.suspendedOfficers}
        />
      </Group>

      <Group name={t("emsFd")}>
        <Item count={counts.emsDeputiesCount} name="total" />
        <Item
          count={counts.onDutyEmsDeputies}
          name={t("onDuty")}
          percentage={(100 / counts.emsDeputiesCount) * counts.onDutyEmsDeputies}
        />
        <Item
          count={counts.suspendedEmsFDDeputies}
          name={t("suspended")}
          percentage={(100 / counts.emsDeputiesCount) * counts.suspendedEmsFDDeputies}
        />
      </Group>

      <Group name={t("images")}>
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

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, res, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/admin", null]]);

  // https://nextjs.org/docs/going-to-production#caching
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=59");

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
