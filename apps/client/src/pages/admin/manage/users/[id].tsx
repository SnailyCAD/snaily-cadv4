import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { Form, Formik } from "formik";
import { UPDATE_USER_SCHEMA } from "@snailycad/schemas";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { useAuth } from "context/AuthContext";
import {
  Loader,
  Button,
  buttonVariants,
  SelectField,
  TextField,
  Breadcrumbs,
  BreadcrumbItem,
} from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { FormRow } from "components/form/FormRow";
import { handleValidate } from "lib/handleValidate";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { usePermission, Permissions } from "hooks/usePermission";
import dynamic from "next/dynamic";
import { SettingsFormField } from "components/form/SettingsFormField";
import { AlertModal } from "components/modal/AlertModal";
import { ApiTokenArea } from "components/admin/manage/users/api-token-area";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import type {
  GetCustomRolesData,
  GetManageUserByIdData,
  PutManageUserByIdData,
} from "@snailycad/types/api";

const DangerZone = dynamic(
  async () => (await import("components/admin/manage/users/danger-zone")).DangerZone,
);

const BanArea = dynamic(
  async () => (await import("components/admin/manage/users/ban-area")).BanArea,
);

const ManageRolesModal = dynamic(
  async () =>
    (await import("components/admin/manage/users/modals/manage-roles-modal")).ManageRolesModal,
  { ssr: false },
);

const ManagePermissionsModal = dynamic(
  async () =>
    (await import("components/admin/manage/users/modals/manage-permissions-modal"))
      .ManagePermissionsModal,
  { ssr: false },
);

interface Props {
  roles: GetCustomRolesData;
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
    username: user.username,
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
      <Breadcrumbs>
        <BreadcrumbItem href="/admin/manage/users">{t("MANAGE_USERS")}</BreadcrumbItem>
        <BreadcrumbItem>{t("editUser")}</BreadcrumbItem>
        <BreadcrumbItem>{user.username}</BreadcrumbItem>
      </Breadcrumbs>

      <Title renderLayoutTitle={false} className="mb-2">
        {t("editUser")}
      </Title>

      <div className="mt-5">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ setFieldValue, isValid, values, errors }) => (
            <Form className="p-4 rounded-md dark:border card">
              <TextField
                label="Username"
                name="username"
                onChange={(value) => setFieldValue("username", value)}
                value={values.username}
                errorMessage={errors.username}
              />

              <SelectField
                isDisabled={isRankDisabled}
                errorMessage={errors.rank}
                label="Rank"
                name="rank"
                onSelectionChange={(key) => setFieldValue("rank", key)}
                selectedKey={values.rank}
                options={
                  isRankDisabled
                    ? [{ value: user.rank, label: user.rank }]
                    : [
                        { value: "ADMIN", label: "Admin" },
                        { value: "USER", label: "User" },
                      ]
                }
              >
                <small className="text-base mt-2 text-neutral-600 dark:text-gray-300 mb-3">
                  The rank does not have any influence on the permissions of the user. It is only
                  used to identify the user in the system.
                </small>
              </SelectField>

              <SettingsFormField
                description="A detailed permissions system where you can assign many actions to a user."
                label={t("detailedPermissions")}
              >
                <Button
                  disabled={user.rank === Rank.OWNER}
                  type="button"
                  onPress={() => openModal(ModalIds.ManagePermissions)}
                >
                  {t("managePermissions")}
                </Button>

                <Button
                  variant="cancel"
                  className="ml-2 text-base"
                  disabled={user.rank === Rank.OWNER}
                  type="button"
                  onPress={() => openModal(ModalIds.ManageRoles)}
                >
                  {t("manageRoles")}
                </Button>
              </SettingsFormField>

              <FormRow>
                <TextField
                  isOptional
                  label="Steam ID"
                  name="steamId"
                  onChange={(value) => setFieldValue("steamId", value)}
                  value={values.steamId}
                  errorMessage={errors.steamId}
                />

                <TextField
                  isOptional
                  label="Discord ID"
                  name="discordId"
                  onChange={(value) => setFieldValue("discordId", value)}
                  value={values.discordId}
                  errorMessage={errors.discordId}
                />
              </FormRow>

              <div className="flex justify-end mt-3">
                <Link
                  href="/admin/manage/users"
                  className={classNames(buttonVariants.cancel, "p-1 px-4 rounded-md")}
                >
                  {common("goBack")}
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

      {user.rank !== Rank.OWNER ? (
        <>
          <ManagePermissionsModal onUpdate={(user) => setUser(user)} user={user} />
          <ManageRolesModal onUpdate={(user) => setUser(user)} roles={props.roles} user={user} />
        </>
      ) : null}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, locale, req }) => {
  const sessionUser = await getSessionUser(req);
  const [user, roles] = await requestAll(req, [
    [`/admin/manage/users/${query.id}`, null],
    ["/admin/manage/custom-roles?includeAll=true", { totalCount: 0, customRoles: [] }],
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
