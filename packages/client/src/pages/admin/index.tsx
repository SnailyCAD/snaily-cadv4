import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import prettyBytes from "pretty-bytes";
import { useTranslations } from "next-intl";
import { Title } from "components/shared/Title";

interface Counts {
  activeUsers: number;
  pendingUsers: number;
  bannedUsers: number;

  createdCitizens: number;
  arrestCitizens: number;
  deadCitizens: number;
  citizensInBolo: number;

  vehicles: number;
  impoundedVehicles: number;
  vehiclesInBOLO: number;

  imageData: {
    count: number;
    totalSize: number;
  };
}

export default function Admin({ counts }: { counts: Counts | null }) {
  const t = useTranslations("Management");

  if (!counts) {
    return null;
  }

  return (
    <AdminLayout>
      <Title>{t("adminDashboard")}</Title>

      <h1 className="text-3xl font-semibold dark:text-white">Dashboard</h1>

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

const Group = ({ name, children }: { name: string; children: React.ReactNode }) => {
  return (
    <section className="max-w-2xl my-2 mb-7">
      <h4 className="text-lg">{name}</h4>

      <div className="flex justify-between">{children}</div>
    </section>
  );
};

const Item = ({
  count,
  name,
  percentage,
}: {
  count: number | string;
  name: string;
  percentage?: number;
}) => {
  return (
    <div className="relative flex items-end select-none">
      <div>
        <span className="font-sans text-5xl font-semibold">{count}</span>
      </div>

      <div className="flex flex-col items-end">
        {percentage ? (
          <span className="text-lg text-gray-500 dark:text-gray-300">{percentage}%</span>
        ) : null}
        <span className="ml-3 text-xl">{name}</span>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data] = await requestAll(req, [["/admin/", null]]);

  return {
    props: {
      counts: data,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};
