import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import { Formik } from "formik";
import { UPDATE_USER_SCHEMA } from "@snailycad/schemas";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { User } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useAuth } from "context/AuthContext";
import { Button } from "components/Button";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { BanArea } from "components/admin/manage/users/BanArea";
import { handleValidate } from "lib/handleValidate";
import { Input } from "components/form/inputs/Input";
import { requestAll } from "lib/utils";
import { DangerZone } from "components/admin/manage/users/DangerZone";
import { Title } from "components/shared/Title";

interface Props {
  user: User | null;
}

export default function ManageCitizens(props: Props) {
  const [user, setUser] = React.useState(props.user);
  const { state, execute } = useFetch();
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

    if (json.id) {
      setUser({ ...user, ...json });
    }
  }

  const INITIAL_VALUES = {
    rank: user.rank,
    isDispatch: user.isDispatch,
    isLeo: user.isLeo,
    isSupervisor: user.isSupervisor,
    isEmsFd: user.isEmsFd,
    isTow: user.isTow,
    steamId: user.steamId ?? "",
    discordId: user.discordId ?? "",
  };

  const isRankDisabled = user.rank === "OWNER" || user.id === session?.id;
  const validate = handleValidate(UPDATE_USER_SCHEMA);

  return (
    <AdminLayout>
      <Title>
        {common("manage")} {user.username}
      </Title>

      <h1 className="text-3xl font-semibold">{user.username}</h1>

      <div className="mt-5">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, handleSubmit, isValid, values, errors }) => (
            <form onSubmit={handleSubmit}>
              <FormField errorMessage={errors.rank} label="Rank">
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
                          { value: "USER", label: "User" },
                        ]
                  }
                />
              </FormField>

              <FormRow flexLike className="mt-5">
                <FormField errorMessage={errors.isLeo} label="Leo Access">
                  <Toggle name="isLeo" onClick={handleChange} toggled={values.isLeo} />
                </FormField>

                <FormField errorMessage={errors.isSupervisor} label="LEO Supervisor">
                  <Toggle
                    name="isSupervisor"
                    onClick={handleChange}
                    toggled={values.isSupervisor}
                  />
                </FormField>

                <FormField errorMessage={errors.isDispatch} label="Dispatch Access">
                  <Toggle name="isDispatch" onClick={handleChange} toggled={values.isDispatch} />
                </FormField>

                <FormField errorMessage={errors.isEmsFd} label="EMS-FD Access">
                  <Toggle name="isEmsFd" onClick={handleChange} toggled={values.isEmsFd} />
                </FormField>

                <FormField errorMessage={errors.isTow} label="Tow Access">
                  <Toggle name="isTow" onClick={handleChange} toggled={values.isTow} />
                </FormField>
              </FormRow>

              <FormRow>
                <FormField optional errorMessage={errors.steamId} label="Steam ID">
                  <Input name="steamId" onChange={handleChange} value={values.steamId} />
                </FormField>

                <FormField optional errorMessage={errors.discordId} label="Discord ID">
                  <Input name="discordId" onChange={handleChange} value={values.discordId} />
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
        {user.rank !== "OWNER" ? <DangerZone user={user} /> : null}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const [user] = await requestAll(req, [[`/admin/manage/users/${query.id}`, null]]);

  return {
    props: {
      user,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
