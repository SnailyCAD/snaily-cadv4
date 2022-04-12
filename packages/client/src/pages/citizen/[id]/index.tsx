import * as React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslations } from "use-intl";
import { PersonFill } from "react-bootstrap-icons";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { Layout } from "components/Layout";
import { useModal } from "state/modalState";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { getTranslations } from "lib/getTranslation";
import { VehiclesCard } from "components/citizen/vehicles/VehiclesCard";
import { WeaponsCard } from "components/citizen/weapons/WeaponsCard";
import { LicensesCard } from "components/citizen/licenses/LicensesCard";
import { MedicalRecords } from "components/citizen/medical-records/MedicalRecords";
import { calculateAge, formatCitizenAddress, requestAll } from "lib/utils";
import { useCitizen } from "context/CitizenContext";
// import { RecordsArea } from "components/leo/modals/NameSearchModal/tabs/RecordsArea";
import dynamic from "next/dynamic";
import { useImageUrl } from "hooks/useImageUrl";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { ManageOccupationModal } from "components/citizen/modals/ManageOccupationModal";
import { Infofield } from "components/shared/Infofield";
import { Title } from "components/shared/Title";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";
import { RecordsTab } from "components/leo/modals/NameSearchModal/tabs/RecordsTab";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const CitizenImageModal = dynamic(
  async () => (await import("components/citizen/modals/CitizenImageModal")).CitizenImageModal,
);

export default function CitizenId() {
  const { execute, state } = useFetch();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");
  const router = useRouter();
  const { citizen } = useCitizen();
  const { makeImageUrl } = useImageUrl();
  const { cad } = useAuth();
  const { SOCIAL_SECURITY_NUMBERS, ALLOW_CITIZEN_DELETION_BY_NON_ADMIN } = useFeatureEnabled();

  async function handleDelete() {
    if (!citizen) return;
    const data = await execute(`/citizen/${citizen.id}`, {
      method: "DELETE",
    });

    if (data.json) {
      closeModal(ModalIds.AlertDeleteCitizen);
      router.push("/citizen");
    }
  }

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!citizen?.id) {
        router.push("/404");
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [router, citizen]);

  if (!citizen) {
    return null;
  }

  return (
    <Layout className="dark:text-white">
      <Title>
        {citizen.name} {citizen.surname}
      </Title>

      <div className="flex items-start justify-between p-4 card">
        <div className="flex flex-col items-start sm:flex-row">
          {citizen.imageId ? (
            <button onClick={() => openModal(ModalIds.CitizenImage)} className="cursor-pointer">
              <img
                className="rounded-full w-[150px] h-[150px] object-cover"
                draggable={false}
                src={makeImageUrl("citizens", citizen.imageId)}
              />
            </button>
          ) : (
            <PersonFill className="text-gray-500/60 w-[150px] h-[150px]" />
          )}

          <div className="flex flex-col mt-2 sm:ml-3 sm:mt-0">
            <Infofield label={t("fullName")}>
              {citizen.name} {citizen.surname}
            </Infofield>

            {SOCIAL_SECURITY_NUMBERS && citizen.socialSecurityNumber ? (
              <Infofield label={t("socialSecurityNumber")}>
                {citizen.socialSecurityNumber}
              </Infofield>
            ) : null}

            <Infofield label={t("dateOfBirth")}>
              <FullDate isDateOfBirth onlyDate>
                {citizen.dateOfBirth}
              </FullDate>{" "}
              ({t("age")}: {calculateAge(citizen.dateOfBirth)})
            </Infofield>
            <Infofield label={t("gender")}>{citizen.gender.value}</Infofield>
            <Infofield label={t("ethnicity")}>{citizen.ethnicity.value}</Infofield>
            <Infofield label={t("hairColor")}>{citizen.hairColor}</Infofield>
            <Infofield label={t("eyeColor")}>{citizen.eyeColor}</Infofield>
          </div>

          <div className="flex flex-col sm:ml-5">
            <Infofield label={t("weight")}>
              {citizen.weight} {cad?.miscCadSettings?.weightPrefix}
            </Infofield>

            <Infofield label={t("height")}>
              {citizen.height} {cad?.miscCadSettings?.heightPrefix}
            </Infofield>

            <Infofield label={t("address")}>{formatCitizenAddress(citizen)}</Infofield>
            <Infofield label={t("phoneNumber")}>{citizen.phoneNumber || common("none")}</Infofield>

            <ManageOccupationModal occupation={citizen.occupation} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => router.push(`/citizen/${citizen.id}/edit`)}>
            <Link href={`/citizen/${citizen.id}/edit`}>
              <a>{t("editCitizen")}</a>
            </Link>
          </Button>
          {ALLOW_CITIZEN_DELETION_BY_NON_ADMIN ? (
            <Button onClick={() => openModal(ModalIds.AlertDeleteCitizen)} variant="danger">
              {t("deleteCitizen")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 mt-3 gap-y-3 md:grid-cols-2">
        <LicensesCard />
        <MedicalRecords medicalRecords={citizen.medicalRecords} />
      </div>

      <div className="mt-3 space-y-3">
        <VehiclesCard vehicles={citizen.vehicles} />
        <WeaponsCard weapons={citizen.weapons} />
        {/* <RecordsArea records={citizen.Record} /> */}
        <RecordsTab records={citizen.Record} isCitizen />
      </div>

      <CitizenImageModal citizen={citizen} />

      {ALLOW_CITIZEN_DELETION_BY_NON_ADMIN ? (
        <AlertModal
          onDeleteClick={handleDelete}
          title={t("deleteCitizen")}
          description={t.rich("alert_deleteCitizen", {
            citizen: `${citizen.name} ${citizen.surname}`,
            span: (children) => {
              return <span className="font-semibold">{children}</span>;
            },
          })}
          id={ModalIds.AlertDeleteCitizen}
          state={state}
        />
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, query, req }) => {
  const [data, values] = await requestAll(req, [
    [`/citizen/${query.id}`, null],
    ["/admin/values/license?paths=driverslicense_category,blood_group", []],
  ]);

  return {
    props: {
      session: await getSessionUser(req),
      citizen: data,
      values,
      messages: {
        ...(await getTranslations(["citizen", "leo", "common"], locale)),
      },
    },
  };
};
