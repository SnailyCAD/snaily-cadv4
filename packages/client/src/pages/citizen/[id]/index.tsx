import * as React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslations } from "use-intl";
import Head from "next/head";
import { PersonFill } from "react-bootstrap-icons";
import format from "date-fns/format";
import { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { Layout } from "components/Layout";
import { useModal } from "context/ModalContext";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { getTranslations } from "lib/getTranslation";
import { VehiclesCard } from "components/citizen/VehiclesCard";
import { WeaponsCard } from "components/citizen/WeaponsCard";
import { LicensesCard } from "components/citizen/LicensesCard";
import { MedicalRecords } from "components/citizen/MedicalRecords";
import { calculateAge, makeImageUrl, requestAll } from "lib/utils";
import { useCitizen } from "context/CitizenContext";
import { RecordsArea } from "components/leo/modals/NameSearchModal/RecordsArea";
import dynamic from "next/dynamic";

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

  async function handleDelete() {
    if (!citizen) return;
    const data = await execute(`/citizen/${citizen.id}`, {
      method: "DELETE",
    });

    if (data.json) {
      closeModal("deleteCitizen");
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
    <Layout>
      <Head>
        <title>
          {citizen.name} {citizen.surname} - SnailyCAD
        </title>
      </Head>

      <div className="card bg-gray-200/60 p-4 rounded-md flex items-start justify-between">
        <div className="flex flex-col sm:flex-row items-start">
          {citizen.imageId ? (
            <button onClick={() => openModal("citizenImage")} className="cursor-pointer">
              <img
                className="rounded-full w-[150px] h-[150px] object-cover"
                draggable={false}
                src={makeImageUrl("citizens", citizen.imageId)}
              />
            </button>
          ) : (
            <PersonFill className="text-gray-500/60 w-[150px] h-[150px]" />
          )}

          <div className="sm:ml-3 mt-2 sm:mt-0 flex flex-col">
            <p>
              <span className="font-semibold">{t("fullName")}: </span>
              {citizen.name} {citizen.surname}
            </p>
            <p>
              <span className="font-semibold">{t("dateOfBirth")}: </span>
              {format(new Date(citizen.dateOfBirth), "yyyy-MM-dd")} ({t("age")}:{" "}
              {calculateAge(citizen.dateOfBirth)})
            </p>
            <p>
              <span className="font-semibold">{t("gender")}: </span>
              {citizen.gender.value}
            </p>
            <p>
              <span className="font-semibold">{t("ethnicity")}: </span>
              {citizen.ethnicity.value}
            </p>
            <p>
              <span className="font-semibold">{t("hairColor")}: </span>
              {citizen.hairColor}
            </p>
            <p>
              <span className="font-semibold">{t("eyeColor")}: </span>
              {citizen.eyeColor}
            </p>
          </div>

          <div className="sm:ml-5 flex flex-col">
            <p>
              <span className="font-semibold">{t("weight")}: </span>
              {citizen.weight}
            </p>
            <p>
              <span className="font-semibold">{t("height")}: </span>
              {citizen.height}
            </p>
            <p>
              <span className="font-semibold">{t("address")}: </span>
              {citizen.address}
            </p>
            <p>
              <span className="font-semibold">{t("phoneNumber")}: </span>
              {citizen.phoneNumber ?? common("none")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => router.push(`/citizen/${citizen.id}/edit`)} variant="success">
            <Link href={`/citizen/${citizen.id}/edit`}>
              <a>{t("editCitizen")}</a>
            </Link>
          </Button>
          <Button onClick={() => openModal("deleteCitizen")} variant="danger">
            {t("deleteCitizen")}
          </Button>
        </div>
      </div>

      <div className="mt-3 gap-2 gap-y-3 grid grid-cols-1 md:grid-cols-2">
        <LicensesCard />
        <MedicalRecords medicalRecords={citizen.medicalRecords} />
        {/* <ViolationsCard weapons={[]} /> */}
      </div>

      <div className="mt-3 space-y-3">
        <VehiclesCard vehicles={citizen.vehicles} />
        <WeaponsCard weapons={citizen.weapons} />
        <RecordsArea records={citizen.Record} />
      </div>

      <CitizenImageModal />

      <AlertModal
        onDeleteClick={handleDelete}
        title="Delete Citizen"
        description={t.rich("alert_deleteCitizen", {
          citizen: `${citizen.name} ${citizen.surname}`,
          span: (children) => {
            return <span className="font-semibold">{children}</span>;
          },
        })}
        id="deleteCitizen"
        state={state}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, query, req }) => {
  const [data, values] = await requestAll(req, [
    [`/citizen/${query.id}`, []],
    ["/admin/values/weapon?paths=license,vehicle,driverslicense_category,blood_group", []],
  ]);
  return {
    props: {
      session: await getSessionUser(req.headers),
      citizen: data,
      values,
      messages: {
        ...(await getTranslations(["citizen", "leo", "common"], locale)),
      },
    },
  };
};
