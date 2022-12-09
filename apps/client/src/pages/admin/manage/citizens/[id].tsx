import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank, ValueType } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { Permissions } from "@snailycad/permissions";
import type { SelectValue } from "components/form/Select";
import type {
  GetManageCitizenByIdData,
  PostCitizenImageByIdData,
  PutManageCitizenByIdData,
} from "@snailycad/types/api";
import { BreadcrumbItem, Breadcrumbs } from "@snailycad/ui";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

interface Props {
  citizen: NonNullable<GetManageCitizenByIdData>;
}

export default function ManageCitizens({ citizen }: Props) {
  const t = useTranslations();
  const { state, execute } = useFetch();
  const router = useRouter();
  useLoadValuesClientSide({
    valueTypes: [ValueType.GENDER, ValueType.ETHNICITY, ValueType.LICENSE],
  });

  async function handleSubmit({
    data,
    helpers,
    formData,
  }: {
    data: any;
    formData?: FormData;
    helpers: any;
  }) {
    const { json, error } = await execute<PutManageCitizenByIdData>({
      path: `/admin/manage/citizens/${citizen.id}`,
      method: "PUT",
      helpers,
      data: {
        ...data,
        driversLicenseCategory: Array.isArray(data.driversLicenseCategory)
          ? (data.driversLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.driversLicenseCategory,
        pilotLicenseCategory: Array.isArray(data.pilotLicenseCategory)
          ? (data.pilotLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.pilotLicenseCategory,
        waterLicenseCategory: Array.isArray(data.waterLicenseCategory)
          ? (data.waterLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.waterLicenseCategory,
        firearmLicenseCategory: Array.isArray(data.firearmLicenseCategory)
          ? (data.firearmLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.firearmLicenseCategory,
      },
    });

    const errors = ["dateLargerThanNow", "nameAlreadyTaken", "invalidImageType"];
    if (errors.includes(error as string)) {
      helpers.setCurrentStep(0);
    }

    if (formData) {
      await execute<PostCitizenImageByIdData>({
        path: `/citizen/${citizen.id}`,
        method: "POST",
        data: formData,
        helpers,
      });
    }

    if (json.id) {
      router.push("/admin/manage/citizens");
    }
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageCitizens],
      }}
    >
      <Breadcrumbs>
        <BreadcrumbItem href="/admin/manage/citizens">
          {t("Management.MANAGE_CITIZENS")}
        </BreadcrumbItem>
        <BreadcrumbItem>{t("Citizen.editCitizen")}</BreadcrumbItem>
        <BreadcrumbItem>
          {citizen.name} {citizen.surname}
        </BreadcrumbItem>
      </Breadcrumbs>

      <Title renderLayoutTitle={false}>
        {t("Common.manage")} {citizen.name} {citizen.surname}
      </Title>

      <div className="mt-5">
        <ManageCitizenForm
          formFeatures={{
            "edit-name": true,
            "edit-user": true,
            "license-fields": true,
          }}
          citizen={citizen}
          onSubmit={handleSubmit}
          state={state}
          cancelURL="/admin/manage/citizens"
        />
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, query, req }) => {
  const user = await getSessionUser(req);
  const [citizen] = await requestAll(req, [[`/admin/manage/citizens/${query.id}`, null]]);

  if (!citizen) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      citizen,
      session: user,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
