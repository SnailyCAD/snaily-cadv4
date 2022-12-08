import * as React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslations } from "use-intl";
import { PersonFill } from "react-bootstrap-icons";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { Layout } from "components/Layout";
import { useModal } from "state/modalState";
import { BreadcrumbItem, Breadcrumbs, Button, buttonVariants } from "@snailycad/ui";
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
import { RecordsTab } from "components/leo/modals/NameSearchModal/tabs/records-tab";
import { classNames } from "lib/classNames";
import type { DeleteCitizenByIdData } from "@snailycad/types/api";
import Image from "next/image";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const CitizenImageModal = dynamic(
  async () => (await import("components/citizen/modals/CitizenImageModal")).CitizenImageModal,
);
const WeaponsCard = dynamic(
  async () => (await import("components/citizen/weapons/weapons-card")).WeaponsCard,
);

export default function CitizenId() {
  const { execute, state } = useFetch();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");
  const router = useRouter();
  const { citizen, setCurrentCitizen } = useCitizen();
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

  async function handleDeceased() {
    if (!citizen) return;
    const data = await execute<DeleteCitizenByIdData>({
      path: `/citizen/${citizen.id}/deceased`,
      method: "POST",
    });

    if (typeof data.json === "boolean" && data.json) {
      closeModal(ModalIds.AlertMarkDeceased);
      setCurrentCitizen({ ...citizen, dead: true, dateOfDead: new Date() });
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
      <Breadcrumbs>
        <BreadcrumbItem href="/citizen">{t("citizen")}</BreadcrumbItem>
        <BreadcrumbItem>
          {citizen.name} {citizen.surname}
        </BreadcrumbItem>
      </Breadcrumbs>

      <Title renderLayoutTitle={false}>
        {citizen.name} {citizen.surname}
      </Title>

      {citizen.dead && citizen.dateOfDead ? (
        <div className="p-2 my-2 font-semibold text-black rounded-md bg-amber-500">
          {t.rich("citizenDead", {
            // @ts-expect-error this is a valid element type
            date: <FullDate>{citizen.dateOfDead}</FullDate>,
          })}
        </div>
      ) : null}

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
          <Link
            className={classNames(buttonVariants.default, "p-1 px-4 rounded-md")}
            href={`/citizen/${citizen.id}/edit`}
          >
            {t("editCitizen")}
          </Link>
          {ALLOW_CITIZEN_DELETION_BY_NON_ADMIN ? (
            <>
              <Button onPress={() => openModal(ModalIds.AlertDeleteCitizen)} variant="danger">
                {t("deleteCitizen")}
              </Button>

              {!citizen.dead ? (
                <Button onPress={() => openModal(ModalIds.AlertMarkDeceased)} variant="danger">
                  {t("markCitizenDeceased")}
                </Button>
              ) : null}
            </>
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
        <>
          <AlertModal
            onDeleteClick={handleDelete}
            title={t("deleteCitizen")}
            description={t.rich("alert_deleteCitizen", {
              citizen: `${citizen.name} ${citizen.surname}`,
            })}
            id={ModalIds.AlertDeleteCitizen}
            state={state}
          />

          {!citizen.dead ? (
            <AlertModal
              deleteText={t("markCitizenDeceased")}
              onDeleteClick={handleDeceased}
              title={t("markCitizenDeceased")}
              description={t.rich("alert_markCitizenDeceased", {
                citizen: `${citizen.name} ${citizen.surname}`,
              })}
              id={ModalIds.AlertMarkDeceased}
              state={state}
            />
          ) : null}
        </>
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
