import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import type { User } from "types/prisma";
import { AdminLayout } from "components/admin/AdminLayout";
import { Formik } from "formik";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Error } from "components/form/Error";
import { useAuth } from "context/AuthContext";
import { Button } from "components/Button";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { BanArea } from "components/admin/manage/BanArea";

interface Props {
  user: User | null;
}

export default function ManageCitizens(props: Props) {
  const [user, setUser] = React.useState(props.user);
  const { state, execute } = useFetch();
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const router = useRouter();
  const { user: session } = useAuth();

  React.useEffect(() => {
    if (!user) {
      router.push("/404");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!user) return;

    const { json } = await execute(`/admin/manage/users/${user.id}`, {
      method: "PUT",
      data: values,
    });

    console.log(json);
  }

  const INITIAL_VALUES = {
    rank: user.rank,
    isDispatch: user.isDispatch,
    isLeo: user.isLeo,
    isEmsFd: user.isEmsFd,
    isTow: user.isTow,
  };

  const isRankDisabled = user.rank === "OWNER" || user.id === session?.id;

  return (
    <AdminLayout>
      <Head>
        <title>{t("MANAGE_USERS")}</title>
      </Head>

      <h1 className="text-3xl font-semibold">{user?.username}</h1>

      <div className="mt-5">
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, handleSubmit, isValid, values, errors }) => (
            <form onSubmit={handleSubmit}>
              <FormField label="Rank">
                <Select
                  name="rank"
                  onChange={handleChange}
                  disabled={isRankDisabled}
                  value={values.rank}
                  values={
                    isRankDisabled
                      ? [{ value: user.rank, label: user.rank }]
                      : [
                          { value: "ADMIN", label: "Admin" },
                          { value: "MODERATOR", label: "Moderator" },
                          { value: "USER", label: "User" },
                        ]
                  }
                />
                <Error>{errors.rank}</Error>
              </FormField>

              <FormRow className="mt-5">
                <FormField label="Leo Access">
                  <Toggle name="isLeo" onClick={handleChange} toggled={values.isLeo} />

                  <Error>{errors.isLeo}</Error>
                </FormField>

                <FormField label="Dispatch Access">
                  <Toggle name="isDispatch" onClick={handleChange} toggled={values.isDispatch} />

                  <Error>{errors.isDispatch}</Error>
                </FormField>

                <FormField label="EMS-FD Access">
                  <Toggle name="isEmsFd" onClick={handleChange} toggled={values.isEmsFd} />

                  <Error>{errors.isEmsFd}</Error>
                </FormField>

                <FormField label="Tow Access">
                  <Toggle name="isTow" onClick={handleChange} toggled={values.isTow} />

                  <Error>{errors.isTow}</Error>
                </FormField>
              </FormRow>

              <div className="flex justify-end">
                <Link href="/admin/manage/users">
                  <a>
                    <Button type="button" variant="cancel">
                      {common("cancel")}
                    </Button>
                  </a>
                </Link>
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {common("save")}
                </Button>
              </div>
            </form>
          )}
        </Formik>

        <BanArea setUser={setUser} user={user} />
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const { data } = await handleRequest(`/admin/manage/users/${query.id}`, {
    headers: req.headers,
  }).catch(() => ({ data: null }));

  return {
    props: {
      user: data,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["citizen", "admin", "common"], locale)),
      },
    },
  };
};
