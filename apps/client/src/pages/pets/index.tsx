import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";

interface PetsPageProps {
  pets: GetPetsData;
}

export default function PetsPage(props: PetsPageProps) {
  const t = useTranslations();

  const asyncTable = useAsyncTable({
    fetchOptions: {
      path: "/pets",
      onResponse(data) {
        return { data: data.pets, totalCount: data.totalCount };
      },
    },
    initialData: props.pets.pets,
    totalCount: props.pets.totalCount,
  });
  const tableState = useTableState(asyncTable);

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between mb-5">
        <Title>{t("Pets.pets")}</Title>

        <Button>{t("Pets.createPet")}</Button>
      </header>
      <Table
        tableState={tableState}
        data={asyncTable.items.map((pet) => ({
          id: pet.id,
          name: pet.name,
          breed: pet.breed,
          actions: <Button>{t("Pets.viewPet")}</Button>,
        }))}
        columns={[
          { accessorKey: "name", header: t("Pets.name") },
          { accessorKey: "breed", header: t("Pets.breed") },
          { accessorKey: "actions", header: t("Common.actions") },
        ]}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/pets", { totalCount: 0, pets: [] }]]);

  return {
    props: {
      pets: data,
      session: user,
      messages: {
        ...(await getTranslations(["citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};
