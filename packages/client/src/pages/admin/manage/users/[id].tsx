import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import { Form, Formik } from "formik";
import { UPDATE_USER_SCHEMA } from "@snailycad/schemas";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank, User } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useAuth } from "context/AuthContext";
import { Button, buttonVariants } from "components/Button";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { handleValidate } from "lib/handleValidate";
import { Input } from "components/form/inputs/Input";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ManagePermissionsModal } from "components/admin/manage/users/ManagePermissionsModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { usePermission, Permissions } from "hooks/usePermission";
import dynamic from "next/dynamic";
import { SettingsFormField } from "components/form/SettingsFormField";
import { AlertModal } from "components/modal/AlertModal";
import { ApiTokenArea } from "components/admin/manage/users/ApiTokenArea";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";

const DangerZone = dynamic(
  async () => (await import("components/admin/manage/users/DangerZone")).DangerZone,
);

const BanArea = dynamic(
  async () => (await import("components/admin/manage/users/BanArea")).BanArea,
);

interface Props {
  user: User | null;
}

export default function ManageCitizens(props: Props) {
  const [user, setUser] = React.useState(props.user);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Management");
  const router = useRouter();
  const { user: session } = useAuth();
  const { openModal, closeModal } = useModal();
  const { hasPermissions } = usePermission();
  const { USER_API_TOKENS } = useFeatureEnabled();

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
    isTaxi: user.isTaxi,
    steamId: user.steamId ?? "",
    discordId: user.discordId ?? "",
    useOldPerms: false,
  };

  const isRankDisabled = user.rank === "OWNER" || user.id === session?.id;
  const validate = handleValidate(UPDATE_USER_SCHEMA);

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.BanUsers, Permissions.ManageUsers, Permissions.DeleteUsers],
      }}
    >
      <Title>
        {common("manage")} {user.username}
      </Title>

      <div className="mt-5">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, setFieldValue, isValid, values, errors }) => (
            <Form>
              {values.useOldPerms ? (
                <>
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
                      <Toggle
                        name="isDispatch"
                        onClick={handleChange}
                        toggled={values.isDispatch}
                      />
                    </FormField>
                    <FormField errorMessage={errors.isEmsFd} label="EMS-FD Access">
                      <Toggle name="isEmsFd" onClick={handleChange} toggled={values.isEmsFd} />
                    </FormField>
                    <FormField errorMessage={errors.isTow} label="Tow Access">
                      <Toggle name="isTow" onClick={handleChange} toggled={values.isTow} />
                    </FormField>
                    <FormField errorMessage={errors.isTaxi} label="Taxi Access">
                      <Toggle name="isTaxi" onClick={handleChange} toggled={values.isTaxi} />
                    </FormField>
                  </FormRow>

                  <Button
                    className="my-4"
                    type="button"
                    onClick={() => setFieldValue("useOldPerms", false)}
                  >
                    {t("useNewPermissions")}
                  </Button>
                </>
              ) : (
                <SettingsFormField
                  description="A detailed permissions system where you can assign many actions to a user."
                  label={
                    <>
                      <span className="p-0.5 px-1 rounded-md bg-gradient-to-tr from-[#1150d4] to-[#a245fc] text-sm mr-2 uppercase">
                        new
                      </span>
                      <span>{t("detailedPermissions")}</span>
                    </>
                  }
                >
                  <Button
                    disabled={user.rank === Rank.OWNER}
                    type="button"
                    onClick={() => openModal(ModalIds.ManagePermissions)}
                  >
                    {t("managePermissions")}
                  </Button>

                  <Button
                    disabled={user.rank === Rank.OWNER}
                    variant="cancel"
                    className="ml-2 text-base"
                    type="button"
                    onClick={() => openModal(ModalIds.AlertUseOldPermissions)}
                  >
                    {t("useOldPermissions")}
                  </Button>
                </SettingsFormField>
              )}

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
                  <a
                    href="/admin/manage/users"
                    className={classNames(buttonVariants.cancel, "p-1 px-4")}
                  >
                    {common("cancel")}
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

              <AlertModal
                title={t("useOldPermissions")}
                description={
                  <>
                    Are you sure you want to use the old permissions system.{" "}
                    <span className="font-semibold">
                      You cannot mix the old permissions with new permissions.
                    </span>
                  </>
                }
                id={ModalIds.AlertUseOldPermissions}
                deleteText={t("useOldPermissions")}
                onDeleteClick={() => {
                  closeModal(ModalIds.AlertUseOldPermissions);
                  setFieldValue("useOldPerms", true);
                }}
              />
            </Form>
          )}
        </Formik>

        <ManagePermissionsModal user={user} />

        {USER_API_TOKENS ? <ApiTokenArea user={user} /> : null}

        {user.rank !== Rank.OWNER ? (
          <>
            {hasPermissions([Permissions.BanUsers], true) ? (
              <BanArea setUser={setUser} user={user} />
            ) : null}
            {hasPermissions([Permissions.DeleteUsers], true) ? <DangerZone user={user} /> : null}
          </>
        ) : null}
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
