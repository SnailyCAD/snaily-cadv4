import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import type { RegisteredVehicle } from "types/prisma";
import { Table } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";

interface Props {
  vehicles: RegisteredVehicle[];
}

export default function ImportVehiclesPage({ vehicles }: Props) {
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const veh = useTranslations("Vehicles");

  return (
    <AdminLayout>
      <Title>{t("IMPORT_VEHICLES")}</Title>
      <h1 className="text-3xl font-semibold">{t("IMPORT_VEHICLES")}</h1>
      {/* <AdvancedCitizensTab /> */}

      <FormField label={common("search")} className="my-2">
        <Input
          placeholder="filter by plate, model, color, etc."
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
      </FormField>

      <Table
        filter={search}
        data={vehicles.map((vehicle) => ({
          plate: vehicle.plate,
          model: vehicle.model.value.value,
          color: vehicle.color,
          registrationStatus: vehicle.registrationStatus.value,
          vinNumber: vehicle.vinNumber,
          createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
        }))}
        columns={[
          { Header: veh("plate"), accessor: "plate" },
          { Header: veh("model"), accessor: "model" },
          { Header: veh("color"), accessor: "color" },
          { Header: veh("registrationStatus"), accessor: "registrationStatus" },
          { Header: veh("vinNumber"), accessor: "vinNumber" },
          { Header: common("createdAt"), accessor: "createdAt" },
          // { Header: common("actions"), accessor: "actions" },
        ]}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [vehicles, values] = await requestAll(req, [
    ["/admin/import/vehicles", []],
    ["/admin/values/gender?paths=ethnicity", []],
  ]);

  return {
    props: {
      values,
      vehicles,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
