import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { Button, FullDate } from "@snailycad/ui";
import { ModalIds } from "types/modal-ids";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetDeadCitizensData, PostEmsFdDeclareCitizenById } from "@snailycad/types/api";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import type { Citizen } from "@snailycad/types";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { toastMessage } from "lib/toastMessage";

interface Props {
  deadCitizens: GetDeadCitizensData;
}

export default function EmsFdIncidents({ deadCitizens }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");

  const { state, execute } = useFetch();
  const modalState = useModal();
  const { hasPermissions } = usePermission();
  const hasMangeDeadCitizensPermissions = hasPermissions([Permissions.ManageDeadCitizens]);

  async function handleDeclareCitizenAlive() {
    if (!tempCitizen) return;

    const { json } = await execute<PostEmsFdDeclareCitizenById>({
      path: `/ems-fd/declare/${tempCitizen.id}`,
      method: "POST",
    });

    if (json) {
      toastMessage({
        title: t("HospitalServices.citizenDeclaredAlive"),
        message: t("HospitalServices.citizenDeclaredAliveMessage", {
          name: `${tempCitizen.name} ${tempCitizen.surname}`,
        }),
      });
      modalState.closeModal(ModalIds.AlertDeclareCitizenAlive);
      tempCitizenState.setTempId(null);
    }
  }

  function handleDeclareCitizenAliveClick(citizenId: string) {
    tempCitizenState.setTempId(citizenId);
    modalState.openModal(ModalIds.AlertDeclareCitizenAlive);
  }

  const asyncTable = useAsyncTable<Citizen>({
    fetchOptions: {
      onResponse: (data: GetDeadCitizensData) => ({
        data: data.citizens,
        totalCount: data.totalCount,
      }),
      path: "/ems-fd/dead-citizens",
    },
    initialData: deadCitizens.citizens,
    totalCount: deadCitizens.totalCount,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempCitizen, tempCitizenState] = useTemporaryItem(asyncTable.items);

  return (
    <Layout
      permissions={{
        permissions: [Permissions.ViewDeadCitizens, Permissions.ManageDeadCitizens],
      }}
      className="dark:text-white"
    >
      <Title className="mb-3">{t("HospitalServices.hospitalServices")}</Title>

      {asyncTable.items.length <= 0 ? (
        <p>{t("HospitalServices.noDeadCitizens")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((citizen) => ({
            id: citizen.id,
            name: `${citizen.name} ${citizen.surname}`,
            dateOfBirth: (
              <FullDate isDateOfBirth onlyDate>
                {citizen.dateOfBirth}
              </FullDate>
            ),
            gender: citizen.gender?.value ?? common("none"),
            ethnicity: citizen.ethnicity?.value ?? common("none"),
            hairColor: citizen.hairColor,
            eyeColor: citizen.eyeColor,
            weight: citizen.weight,
            height: citizen.height,
            actions: (
              <Button
                onPress={() => handleDeclareCitizenAliveClick(citizen.id)}
                variant="success"
                size="xs"
              >
                {t("HospitalServices.declareAlive")}
              </Button>
            ),
          }))}
          columns={[
            { header: t("Citizen.fullName"), accessorKey: "name" },
            { header: t("Citizen.dateOfBirth"), accessorKey: "dateOfBirth" },
            { header: t("Citizen.gender"), accessorKey: "gender" },
            { header: t("Citizen.ethnicity"), accessorKey: "ethnicity" },
            { header: t("Citizen.hairColor"), accessorKey: "hairColor" },
            { header: t("Citizen.eyeColor"), accessorKey: "eyeColor" },
            { header: t("Citizen.weight"), accessorKey: "weight" },
            { header: t("Citizen.height"), accessorKey: "height" },
            hasMangeDeadCitizensPermissions
              ? { header: common("actions"), accessorKey: "actions" }
              : null,
          ]}
        />
      )}

      {hasMangeDeadCitizensPermissions ? (
        <AlertModal
          title={t("HospitalServices.declareAlive")}
          description={t.rich("HospitalServices.alert_declareAlive", {
            citizen: `${tempCitizen?.name} ${tempCitizen?.surname}`,
          })}
          id={ModalIds.AlertDeclareCitizenAlive}
          state={state}
          onDeleteClick={handleDeclareCitizenAlive}
          deleteText={t("HospitalServices.declareAlive")}
        />
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [deadCitizens] = await requestAll(req, [
    ["/ems-fd/dead-citizens", { citizens: [], totalCount: 0 }],
  ]);

  return {
    props: {
      session: user,
      deadCitizens,
      messages: {
        ...(await getTranslations(["ems-fd", "citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};
