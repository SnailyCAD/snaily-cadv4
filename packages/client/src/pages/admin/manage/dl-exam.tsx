import * as React from "react";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { type NameChangeRequest, Rank } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import { Form, Formik } from "formik";
import { useValues } from "context/ValuesContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { SettingsFormField } from "components/form/SettingsFormField";

interface Props {
  settings: unknown;
}

export default function ManageDLExamPage({ settings }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { hasPermissions } = usePermission();
  const { driverslicenseCategory } = useValues();

  async function onSubmit() {}

  const INITIAL_VALUES = {
    cost: "",
  };

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageDLExams],
      }}
    >
      <Title>{t("Management.MANAGE_DL_EXAM")}</Title>

      <h1 className="mb-4 text-3xl font-semibold">{t("Management.MANAGE_DL_EXAM")}</h1>

      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ values, handleChange }) => (
          <Form>
            <SettingsFormField description="The cost of a driver's license exam." label="Cost">
              <Input type="number" onChange={handleChange} name="cost" value={values.cost} />
            </SettingsFormField>
          </Form>
        )}
      </Formik>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [settings] = await requestAll(req, [
    ["/admin/manage/dl-exam", []],
    ["/admin/values/driverslicense_categories", []],
  ]);

  return {
    props: {
      settings,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "courthouse", "values", "common"], locale)),
      },
    },
  };
};
