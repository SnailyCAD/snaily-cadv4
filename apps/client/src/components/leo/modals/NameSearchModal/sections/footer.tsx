import { Button, Loader } from "@snailycad/ui";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { NameSearchFooterActions } from "./footer-actions";

interface Props {
  isLeo?: boolean;
  loadingState: "loading" | "error" | null;
}

export function NameSearchFooter(props: Props) {
  const { currentResult } = useNameSearch();
  const { CREATE_USER_CITIZEN_LEO } = useFeatureEnabled();
  const t = useTranslations();
  const { closeModal } = useModal();

  return (
    <footer
      className={`mt-4 pt-3 flex ${
        (currentResult || CREATE_USER_CITIZEN_LEO) && props.isLeo
          ? "justify-between"
          : "justify-end"
      }`}
    >
      <NameSearchFooterActions isLeo={props.isLeo} />

      <div className="flex">
        <Button type="reset" onPress={() => closeModal(ModalIds.NameSearch)} variant="cancel">
          {t("Common.cancel")}
        </Button>
        <Button
          className="flex items-center"
          disabled={props.loadingState === "loading"}
          type="submit"
        >
          {props.loadingState === "loading" ? <Loader className="mr-2" /> : null}
          {t("Common.search")}
        </Button>
      </div>
    </footer>
  );
}
