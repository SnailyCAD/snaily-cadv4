import type { EmsFdDeputy, Officer, UnitQualification } from "@snailycad/types";
import { Button } from "components/Button";
import { Table } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AddQualificationsModal } from "./AddQualificationsModal";

interface Props {
  unit: (EmsFdDeputy | Officer) & { qualifications: UnitQualification[] };
  setUnit: React.Dispatch<React.SetStateAction<any>>;
}

export function QualificationsTable({ setUnit, unit }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();

  return (
    <div className="mt-3">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("unitQualifications")}</h1>

        <div>
          <Button onClick={() => openModal(ModalIds.ManageUnitQualifications)}>
            {t("addQualification")}
          </Button>
        </div>
      </header>

      {unit.qualifications.length <= 0 ? (
        <p className="my-2 text-gray-400">{t("noQualifications")}</p>
      ) : (
        <Table
          data={unit.qualifications.map((qa) => {
            return {
              name: qa.qualification.value.value,
              actions: (
                <>
                  {qa.suspendedAt ? (
                    <Button small variant="success">
                      {t("unsuspend")}
                    </Button>
                  ) : (
                    <Button small variant="danger">
                      {t("suspend")}
                    </Button>
                  )}
                  <Button className="ml-2" small variant="danger">
                    {common("delete")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { Header: common("name"), accessor: "name" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <AddQualificationsModal setUnit={setUnit} unit={unit} />
    </div>
  );
}
