import * as React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslations } from "use-intl";
import { PersonFill } from "react-bootstrap-icons";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { Layout } from "components/Layout";
import { useModal } from "state/modalState";
import { Button, buttonVariants } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { getTranslations } from "lib/getTranslation";
import { VehiclesCard } from "components/citizen/vehicles/VehiclesCard";
import { LicensesCard } from "components/citizen/licenses/LicensesCard";
import { MedicalRecords } from "components/citizen/medical-records/MedicalRecords";
import { calculateAge, formatCitizenAddress, requestAll } from "lib/utils";
import { useCitizen } from "context/CitizenContext";
import dynamic from "next/dynamic";
import { useImageUrl } from "hooks/useImageUrl";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Infofield } from "components/shared/Infofield";
import { Title } from "components/shared/Title";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";
import { RecordsTab } from "components/leo/modals/NameSearchModal/tabs/RecordsTab";
import { classNames } from "lib/classNames";
import type { DeleteCitizenByIdData } from "@snailycad/types/api";
import Image from "next/future/image";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const CitizenImageModal = dynamic(
  async () => (await import("components/citizen/modals/CitizenImageModal")).CitizenImageModal,
);
const WeaponsCard = dynamic(
  async () => (await import("components/citizen/weapons/WeaponsCard")).WeaponsCard,
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
  const { SOCIAL_SECURITY_NUMBERS, WEAPON_REGISTRATION, ALLOW_CITIZEN_DELETION_BY_NON_ADMIN } =
    useFeatureEnabled();

  async function handleDelete() {
    if (!citizen) return;
    const data = await execute<DeleteCitizenByIdData>({
      path: `/citizen/${citizen.id}`,
      method: "DELETE",
    });

    if (typeof data.json === "boolean" && data.json) {
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
      <Title renderLayoutTitle={false}>
        {citizen.name} {citizen.surname}
      </Title>

      <div className="flex items-start justify-between p-4 card">
        <div className="flex flex-col items-start sm:flex-row">
          {citizen.imageId ? (
            <button
              type="button"
              onClick={() => openModal(ModalIds.CitizenImage)}
              className="cursor-pointer"
              aria-label="View citizen image"
            >
              <Image
                alt={`${citizen.name} ${citizen.surname}`}
                className="rounded-md w-[150px] h-[150px] object-cover"
                draggable={false}
                src={makeImageUrl("citizens", citizen.imageId)!}
                loading="lazy"
                width={150}
                height={150}
              />
            </button>
          ) : (
            <PersonFill className="text-gray-500/60 w-[150px] h-[150px]" />
          )}

          <div className="flex flex-col mt-2 sm:ml-4 sm:mt-0">
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

            <Infofield className="max-w-[400px]" label={t("occupation")}>
              {citizen.occupation || common("none")}
            </Infofield>

            <Infofield className="max-w-[400px]" label={t("additionalInfo")}>
              {citizen.additionalInfo || common("none")}
            </Infofield>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/citizen/${citizen.id}/edit`}>
            <a
              className={classNames(buttonVariants.default, "p-1 px-4 rounded-md")}
              href={`/citizen/${citizen.id}/edit`}
            >
              {t("editCitizen")}
            </a>
          </Link>
          {ALLOW_CITIZEN_DELETION_BY_NON_ADMIN ? (
            <Button onPress={() => openModal(ModalIds.AlertDeleteCitizen)} variant="danger">
              {t("deleteCitizen")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 mt-3 gap-y-3 md:grid-cols-2">
        <LicensesCard />
        <MedicalRecords />
      </div>

      <div className="mt-3 space-y-3">
        <VehiclesCard vehicles={citizen.vehicles} />
        {WEAPON_REGISTRATION ? <WeaponsCard weapons={citizen.weapons} /> : null}

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
  const user = await getSessionUser(req);
  const [data, values] = await requestAll(req, [
    [`/citizen/${query.id}`, null],
    ["/admin/values/license?paths=driverslicense_category,blood_group", []],
  ]);

  return {
    props: {
      session: user,
      citizen: data,
      values,
      messages: {
        ...(await getTranslations(["citizen", "leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
