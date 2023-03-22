import { GetCitizenByIdRecordsData } from "@snailycad/types/api";
import { useQuery } from "@tanstack/react-query";
import { RecordsTab } from "components/leo/modals/NameSearchModal/tabs/records-tab";
import { TableSkeletonLoader } from "components/shared/table/skeleton-loader";
import { useCitizen } from "context/CitizenContext";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";

export function CitizenRecordsCard() {
  const t = useTranslations("Leo");
  const { citizen } = useCitizen(false);

  const { execute } = useFetch();
  const { data, isInitialLoading } = useQuery({
    queryKey: ["citizen-records", citizen.id],
    queryFn: async () => {
      const { json } = await execute<GetCitizenByIdRecordsData>({
        noToast: true,
        path: `/citizen/${citizen.id}/records`,
      });

      return Array.isArray(json) ? json : [];
    },
  });

  return isInitialLoading || !data ? (
    <div className="p-4 card">
      <h1 className="text-3xl font-semibold mb-5">{t("records")}</h1>

      <TableSkeletonLoader
        isWithinCardOrModal
        tableHeaders={[
          { id: "caseNumber" },
          { id: "violations" },
          { id: "postal" },
          { id: "officer" },
          { id: "totalCost" },
          { id: "notes" },
          { id: "createdAt" },
        ]}
      />
    </div>
  ) : (
    <RecordsTab records={data} isCitizen />
  );
}
