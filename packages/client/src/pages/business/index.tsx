import * as React from "react";
import { GetServerSideProps } from "next";
import { handleRequest } from "lib/fetch";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { FullEmployee, useBusinessState } from "state/businessState";
import { Business } from "types/prisma";
import { Layout } from "components/Layout";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";
import { CreateBusinessModal } from "components/business/CreateBusinessModal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { JoinBusinessModal } from "components/business/JoinBusinessModal";
import { BusinessCard } from "components/business/BusinessCard";

interface Props {
  businesses: (FullEmployee & { business: Business })[];
  joinableBusinesses: Business[];
}

export default function BusinessPage(props: Props) {
  const { openModal } = useModal();
  const t = useTranslations("Business");
  const [businesses, setBusinesses] = React.useState(props.businesses);
  const setJoinableBusinesses = useBusinessState((s) => s.setJoinableBusinesses);

  const ownedBusinesses = businesses.filter((em) => em.citizenId === em.business.citizenId);
  const joinedBusinesses = businesses.filter((em) => em.citizenId !== em.business.citizenId);

  React.useEffect(() => {
    setJoinableBusinesses(props.joinableBusinesses);
  }, [props.joinableBusinesses, setJoinableBusinesses]);

  return (
    <Layout>
      <header className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-semibold">{"Businesses"}</h1>

        <div>
          <Button className="mr-2" onClick={() => openModal(ModalIds.JoinBusiness)}>
            Join Business
          </Button>
          <Button onClick={() => openModal(ModalIds.CreateBusiness)}>Create Business</Button>
        </div>
      </header>

      <section>
        <h3 className="text-xl font-semibold mb-2">{t("owned")}</h3>
        <ul className="space-y-3">
          {ownedBusinesses.length <= 0 ? (
            <p>{t("noOwned")}</p>
          ) : (
            ownedBusinesses.map((employee) => (
              <BusinessCard key={employee.id} employee={employee} />
            ))
          )}
        </ul>
      </section>

      <section className="mt-3">
        <h3 className="text-xl font-semibold mb-2">{t("joined")}</h3>
        <ul className="space-y-3">
          {joinedBusinesses.length <= 0 ? (
            <p>{t("notEmployee")}</p>
          ) : (
            joinedBusinesses.map((employee) => (
              <BusinessCard key={employee.id} employee={employee} />
            ))
          )}
        </ul>
      </section>

      <JoinBusinessModal onCreate={(bus: any) => setBusinesses((p) => [...p, bus])} />
      <CreateBusinessModal />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const { data: data } = await handleRequest("/businesses", {
    headers: req.headers,
  }).catch(() => ({ data: {} }));

  const { data: citizens } = await handleRequest("/citizen", {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

  return {
    props: {
      businesses: data?.businesses ?? [],
      joinableBusinesses: data?.joinableBusinesses ?? [],
      citizens,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["business", "common"], locale)),
      },
    },
  };
};
