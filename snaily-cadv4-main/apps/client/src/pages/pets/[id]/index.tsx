import * as React from "react";
import type { GetPetByIdData } from "@snailycad/types/api";
import { BreadcrumbItem, Breadcrumbs, Loader } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { PetInformationCard } from "components/citizen/pets/pet-information-card";
import { Title } from "components/shared/Title";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { usePetsState } from "state/citizen/pets-state";
import { useTranslations } from "use-intl";
import { PetMedicalRecordsCard } from "components/citizen/pets/medical-records/pet-medical-records-card";
import { PetNotesCard } from "components/citizen/pets/notes/pet-notes-card";
import { ManagePetModal } from "components/citizen/pets/manage-pet-modal";

interface PetByIdPageProps {
  pet: GetPetByIdData;
}

export default function PetByIdPage(props: PetByIdPageProps) {
  const t = useTranslations("Pets");
  const { currentPet, setCurrentPet } = usePetsState();

  React.useEffect(() => {
    setCurrentPet(props.pet);
  }, [props.pet]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentPet) {
    return (
      <div className="grid w-full h-full place-content-center py-32">
        <Loader className="w-7 h-7" />
      </div>
    );
  }

  return (
    <Layout className="dark:text-white">
      <Breadcrumbs>
        <BreadcrumbItem href="/pets">{t("pets")}</BreadcrumbItem>
        <BreadcrumbItem>{currentPet.name}</BreadcrumbItem>
      </Breadcrumbs>

      <Title renderLayoutTitle={false}>{currentPet.name}</Title>

      <PetInformationCard />
      <PetMedicalRecordsCard />
      <PetNotesCard />

      <ManagePetModal pet={props.pet} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, query, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [[`/pets/${query.id}`, null]]);

  return {
    notFound: !data,
    props: {
      pet: data,
      session: user,
      messages: {
        ...(await getTranslations(["citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};
