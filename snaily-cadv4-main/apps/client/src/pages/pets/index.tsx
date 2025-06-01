import type { GetUserPetsData } from "@snailycad/types/api";
import { Button, buttonVariants } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { ManagePetModal } from "components/citizen/pets/manage-pet-modal";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

interface PetsPageProps {
  pets: GetUserPetsData;
}

export default function PetsPage(props: PetsPageProps) {
  const t = useTranslations();
  const modalState = useModal();

  const asyncTable = useAsyncTable({
    fetchOptions: {
      path: "/pets",
      onResponse(data: GetUserPetsData) {
        return { data: data.pets, totalCount: data.totalCount };
      },
    },
    initialData: props.pets.pets,
    totalCount: props.pets.totalCount,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between mb-5">
        <Title>{t("Pets.pets")}</Title>

        <Button onPress={() => modalState.openModal(ModalIds.ManagePet)}>
          {t("Pets.createPet")}
        </Button>
      </header>

      {props.pets.totalCount <= 0 ? (
        <p>{t("Pets.noPets")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((pet) => ({
            id: pet.id,
            name: pet.name,
            breed: pet.breed,
            citizen: `${pet.citizen.name} ${pet.citizen.surname}`,
            actions: (
              <Link href={`/pets/${pet.id}`} className={buttonVariants()}>
                {t("Pets.viewPet")}
              </Link>
            ),
          }))}
          columns={[
            { accessorKey: "name", header: t("Pets.name") },
            { accessorKey: "breed", header: t("Pets.breed") },
            { accessorKey: "citizen", header: t("Pets.citizen") },
            { accessorKey: "actions", header: t("Common.actions") },
          ]}
        />
      )}

      <ManagePetModal pet={null} onCreate={(pet) => asyncTable.append(pet)} />
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
