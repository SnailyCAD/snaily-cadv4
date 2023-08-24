import { Button } from "@snailycad/ui";
import { CitizenLicenses } from "components/citizen/licenses/licenses-card";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { LicensePointsSection } from "./license-points/license-points";

interface Props {
  isLeo?: boolean;
}

export function NameSearchLicensesSection(props: Props) {
  const currentResult = useNameSearch((state) => state.currentResult);
  const t = useTranslations();
  const modalState = useModal();

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  return (
    <>
      <section>
        <ul className="flex flex-col">
          <CitizenLicenses citizen={currentResult} />
        </ul>

        {props.isLeo ? (
          <Button
            size="xs"
            type="button"
            className="mt-2"
            onPress={() => modalState.openModal(ModalIds.ManageLicenses)}
          >
            {t("Leo.editLicenses")}
          </Button>
        ) : null}
      </section>

      <section className="mt-3">
        <LicensePointsSection />

        {props.isLeo ? (
          <Button
            size="xs"
            type="button"
            className="mt-2"
            onPress={() => modalState.openModal(ModalIds.ManageLicensePoints)}
          >
            {t("Leo.editLicensePoints")}
          </Button>
        ) : null}
      </section>
    </>
  );
}
