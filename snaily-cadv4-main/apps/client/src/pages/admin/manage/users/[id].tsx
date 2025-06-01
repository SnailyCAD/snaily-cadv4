import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { Form, Formik } from "formik";
import { UPDATE_USER_SCHEMA } from "@snailycad/schemas";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank, WhitelistStatus } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import {
  Loader,
  Button,
  buttonVariants,
  TextField,
  Breadcrumbs,
  BreadcrumbItem,
  Alert,
  FormRow,
} from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { handleValidate } from "lib/handleValidate";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { usePermission, Permissions } from "hooks/usePermission";
import dynamic from "next/dynamic";
import { SettingsFormField } from "components/form/SettingsFormField";
import { ApiTokenArea } from "components/admin/manage/users/api-token-area";
import type {
  GetCustomRolesData,
  GetManageUserByIdData,
  PostManageUserAcceptDeclineData,
  PutManageUserByIdData,
} from "@snailycad/types/api";
import { useAuth } from "context/AuthContext";

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
  user: GetManageUserByIdData | null;
}

export default function ManageCitizens(props: Props) {
  const [user, setUser] = React.useState(props.user!);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Management");
  const modalState = useModal();
  const { hasPermissions } = usePermission();
  const { cad } = useAuth();

  async function handleAcceptUser() {
    const { json } = await execute<PostManageUserAcceptDeclineData>({
      path: `/admin/manage/users/pending/${user.id}/accept`,
      method: "POST",
    });

    if (json) {
      setUser({ ...user, whitelistStatus: WhitelistStatus.ACCEPTED });
    }
  }

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

  if (!props.user) {
    return (
      <AdminLayout
        permissions={{
          permissions: [Permissions.BanUsers, Permissions.ManageUsers, Permissions.DeleteUsers],
        }}
      >
        <Title renderLayoutTitle={false} className="mb-2">
          {t("userNotFoundTitle")}
        </Title>

        <Alert
          type="error"
          className="my-5"
          message={t("userNotFoundError")}
          title={t("userNotFoundTitle")}
        />
      </AdminLayout>
    );
  }

  const INITIAL_VALUES = {
    username: user.username,
    steamId: user.steamId ?? "",
    discordId: user.discordId ?? "",
  };

  const isUserPendingApproval =
    cad?.whitelisted && user.whitelistStatus === WhitelistStatus.PENDING;
  const isUserDenied = cad?.whitelisted && user.whitelistStatus === WhitelistStatus.DECLINED;
  const validate = handleValidate(UPDATE_USER_SCHEMA);

  return (
    <AdminLayout
      permissions={{
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

      {isUserPendingApproval ? (
        <Alert className="mb-5" type="warning" title="User is pending approval">
          <p>
            This user is still pending approval. It must first be approved by an administrator
            before any changes can be done.{" "}
            <Link className="font-medium underline" href="/admin/manage/users">
              Go back
            </Link>
          </p>
        </Alert>
      ) : null}

      {isUserDenied ? (
        <Alert
          className="mb-5"
          type="warning"
          message="This user was denied access. This user may first be approved by an administrator before any changes can be done."
          title="User was denied access"
        >
          <Button onPress={handleAcceptUser} variant="amber" className="mt-3 max-w-fit">
            Accept this user
          </Button>
        </Alert>
      ) : null}

      <div className="mt-5">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ setFieldValue, isValid, values, errors }) => (
            <Form className="p-4 rounded-md dark:border card">
              <TextField
                isDisabled={isUserPendingApproval || isUserDenied}
                label="Username"
                name="username"
                onChange={(value) => setFieldValue("username", value)}
                value={values.username}
                errorMessage={errors.username}
              />

              <SettingsFormField
                description="A detailed permissions system where you can assign many actions to a user."
                label={t("detailedPermissions")}
              >
                <Button
                  disabled={isUserPendingApproval || isUserDenied || user.rank === Rank.OWNER}
                  type="button"
                  onPress={() => modalState.openModal(ModalIds.ManagePermissions)}
                >
                  {t("managePermissions")}
                </Button>

                <Button
                  variant="cancel"
                  className="ml-2 text-base"
                  disabled={isUserPendingApproval || isUserDenied || user.rank === Rank.OWNER}
                  type="button"
                  onPress={() => modalState.openModal(ModalIds.ManageRoles)}
                >
                  {t("manageRoles")}
                </Button>
              </SettingsFormField>

              <FormRow>
                <TextField
                  isDisabled={isUserPendingApproval || isUserDenied}
                  isOptional
                  label="Steam ID"
                  name="steamId"
                  onChange={(value) => setFieldValue("steamId", value)}
                  value={values.steamId}
                  errorMessage={errors.steamId}
                />

                <TextField
                  isDisabled={isUserPendingApproval || isUserDenied}
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
                  className={buttonVariants({
                    variant: "cancel",
                    className: "p-1 px-4",
                  })}
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
            </Form>
          )}
        </Formik>

        {!isUserPendingApproval || !isUserDenied ? <ApiTokenArea user={user} /> : null}

        {user.rank !== Rank.OWNER && (!isUserPendingApproval || !isUserDenied) ? (
          <>
            {hasPermissions([Permissions.BanUsers]) ? (
              <BanArea setUser={setUser} user={user} />
            ) : null}
            {hasPermissions([Permissions.DeleteUsers]) ? (
              <DangerZone setUser={setUser} user={user} />
            ) : null}
          </>
        ) : null}
      </div>

      {user.rank !== Rank.OWNER && (!isUserPendingApproval || !isUserDenied) ? (
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

  return {
    props: {
      user,
      roles,
      session: sessionUser,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "cad-settings", "values", "common"],
          sessionUser?.locale ?? locale,
        )),
      },
    },
  };
};
