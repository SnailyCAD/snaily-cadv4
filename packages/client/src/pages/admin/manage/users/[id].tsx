import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { Form, Formik } from "formik";
import { UPDATE_USER_SCHEMA } from "@snailycad/schemas";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { CustomRole, Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useAuth } from "context/AuthContext";
import { Button, buttonVariants } from "components/Button";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
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
import { ManageRolesModal } from "components/admin/manage/users/ManageRolesModal";
import type { GetManageUserByIdData, PutManageUserByIdData } from "@snailycad/types/api";

const DangerZone = dynamic(
  async () => (await import("components/admin/manage/users/DangerZone")).DangerZone,
);

const BanArea = dynamic(
  async () => (await import("components/admin/manage/users/BanArea")).BanArea,
);

interface Props {
  roles: CustomRole[];
  user: GetManageUserByIdData;
}

export default function ManageCitizens(props: Props) {
  const [user, setUser] = React.useState(props.user);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Management");
  const { user: session } = useAuth();
  const { openModal, closeModal } = useModal();
  const { hasPermissions } = usePermission();
  const { USER_API_TOKENS } = useFeatureEnabled();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PutManageUserByIdData>({
      path: `/admin/manage/users/${user.id}`,
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
      <header className="mb-3">
        <Title className="mb-2">{t("editUser")}</Title>
        <h2 className="text-lg">
          {t.rich("editing", {
            span: (children) => <span className="font-semibold">{children}</span>,
            user: user.username,
          })}
        </h2>
      </header>

      <div className="mt-5">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, setFieldValue, isValid, values, errors }) => (
            <Form className="p-4 rounded-md dark:border card">
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

                <small className="text-base mt-2 text-neutral-600 dark:text-gray-300 mb-3">
                  The rank does not have any influence on the permissions of the user. It is only
                  used to identify the user in the system.
                </small>
              </FormField>

              <SettingsFormField
                description="A detailed permissions system where you can assign many actions to a user."
                label={t("detailedPermissions")}
              >
                <Button
                  disabled={user.rank === Rank.OWNER}
                  type="button"
                  onClick={() => openModal(ModalIds.ManagePermissions)}
                >
                  {t("managePermissions")}
                </Button>

                <Button
                  variant="cancel"
                  className="ml-2 text-base"
                  disabled={user.rank === Rank.OWNER}
                  type="button"
                  onClick={() => openModal(ModalIds.ManageRoles)}
                >
                  {t("manageRoles")}
                </Button>
              </SettingsFormField>

              <FormRow>
                <FormField optional errorMessage={errors.steamId} label="Steam ID">
                  <Input name="steamId" onChange={handleChange} value={values.steamId} />
                </FormField>

                <FormField optional errorMessage={errors.discordId} label="Discord ID">
                  <Input name="discordId" onChange={handleChange} value={values.discordId} />
                </FormField>
              </FormRow>

              <div className="flex justify-end mt-3">
                <Link href="/admin/manage/users">
                  <a
                    href="/admin/manage/users"
                    className={classNames(buttonVariants.cancel, "p-1 px-4 rounded-md")}
                  >
                    {common("goBack")}
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

        {USER_API_TOKENS ? <ApiTokenArea user={user} /> : null}

        {user.rank !== Rank.OWNER ? (
          <>
            {hasPermissions([Permissions.BanUsers], true) ? (
              <BanArea setUser={setUser} user={user} />
            ) : null}
            {hasPermissions([Permissions.DeleteUsers], true) ? (
              <DangerZone setUser={setUser} user={user} />
            ) : null}
          </>
        ) : null}
      </div>

      <ManagePermissionsModal onUpdate={(user) => setUser(user)} user={user} />
      <ManageRolesModal onUpdate={(user) => setUser(user)} roles={props.roles} user={user} />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, locale, req }) => {
  const sessionUser = await getSessionUser(req);
  const [user, roles] = await requestAll(req, [
    [`/admin/manage/users/${query.id}`, null],
    ["/admin/manage/custom-roles", []],
  ]);

  if (!user) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      user,
      roles,
      session: sessionUser,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "values", "common"],
          sessionUser?.locale ?? locale,
        )),
      },
    },
  };
};
