import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import type { RegisteredVehicle } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Button } from "components/Button";
import { ImportModal } from "components/admin/import/ImportModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";

interface Props {
  vehicles: RegisteredVehicle[];
}

export default function ImportVehiclesPage({ vehicles: data }: Props) {
  const [vehicles, setVehicles] = React.useState(data);
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const veh = useTranslations("Vehicles");
  const { openModal } = useModal();

  return (
    <AdminLayout>
      <Title>{t("IMPORT_VEHICLES")}</Title>

      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">{t("IMPORT_VEHICLES")}</h1>

          <div>
            <Button onClick={() => openModal(ModalIds.ImportVehicles)}>{t("importViaFile")}</Button>
          </div>
        </div>

        <p className="my-2 mt-5 dark:text-gray-300 max-w-2xl">
          Here you can mass-import vehicles that are registered to a citizen. In the table below you
          can also view all registered vehicles.
        </p>
      </header>

      <FormField label={common("search")} className="my-2 w-full">
        <Input
          className="w-full"
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
          citizen: `${vehicle.citizen.name} ${vehicle.citizen.surname}`,
          createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
        }))}
        columns={[
          { Header: veh("plate"), accessor: "plate" },
          { Header: veh("model"), accessor: "model" },
          { Header: veh("color"), accessor: "color" },
          { Header: veh("registrationStatus"), accessor: "registrationStatus" },
          { Header: veh("vinNumber"), accessor: "vinNumber" },
          { Header: common("citizen"), accessor: "citizen" },
          { Header: common("createdAt"), accessor: "createdAt" },
        ]}
      />

      <ImportModal
        onImport={(vehicles) => {
          setVehicles((p) => [...vehicles, ...p]);
        }}
        id={ModalIds.ImportVehicles}
        url="/admin/import/vehicles"
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
