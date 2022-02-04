import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import type { Citizen, Weapon } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Button } from "components/Button";
import { ImportModal } from "components/admin/import/ImportModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";

interface Props {
  weapons: (Weapon & { citizen: Citizen })[];
}

export default function ImportWeaponsPage({ weapons: data }: Props) {
  const [weapons, setWeapons] = React.useState(data);
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const wep = useTranslations("Weapons");
  const { openModal } = useModal();

  return (
    <AdminLayout>
      <Title>{t("IMPORT_WEAPONS")}</Title>

      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">{t("IMPORT_WEAPONS")}</h1>

          <div>
            <Button onClick={() => openModal(ModalIds.ImportWeapons)}>{t("importViaFile")}</Button>
          </div>
        </div>

        <p className="my-2 mt-5 dark:text-gray-300 max-w-2xl">
          Here you can mass-import weapons that are registered to a citizen. In the table below you
          can also view all registered weapons.
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
        data={weapons.map((weapon) => ({
          model: weapon.model.value.value,
          registrationStatus: weapon.registrationStatus.value,
          serialNumber: weapon.serialNumber,
          citizen: `${weapon.citizen.name} ${weapon.citizen.surname}`,
          createdAt: <FullDate>{weapon.createdAt}</FullDate>,
        }))}
        columns={[
          { Header: wep("model"), accessor: "model" },
          { Header: wep("registrationStatus"), accessor: "registrationStatus" },
          { Header: wep("serialNumber"), accessor: "serialNumber" },
          { Header: common("citizen"), accessor: "citizen" },
          { Header: common("createdAt"), accessor: "createdAt" },
        ]}
      />

      <ImportModal
        onImport={(vehicles) => {
          setWeapons((p) => [...vehicles, ...p]);
        }}
        id={ModalIds.ImportWeapons}
        url="/admin/import/weapons"
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [weapons, values] = await requestAll(req, [
    ["/admin/import/weapons", []],
    ["/admin/values/gender?paths=ethnicity", []],
  ]);

  return {
    props: {
      values,
      weapons,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
