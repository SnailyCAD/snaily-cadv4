import { Button } from "@snailycad/ui";
import { CitizenLicenses } from "components/citizen/licenses/LicensesCard";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

interface Props {
  isLeo?: boolean;
}

export function NameSearchLicensesSection(props: Props) {
  const currentResult = useNameSearch((state) => state.currentResult);
  const t = useTranslations();
  const { openModal } = useModal();

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  return (
    <div>
      <ul className="flex flex-col">
        <CitizenLicenses citizen={currentResult} />
      </ul>

      {props.isLeo ? (
        <Button
          size="xs"
          type="button"
          className="mt-2"
          onPress={() => openModal(ModalIds.ManageLicenses)}
        >
          {t("Leo.editLicenses")}
        </Button>
      ) : null}
    </div>
  );
}
