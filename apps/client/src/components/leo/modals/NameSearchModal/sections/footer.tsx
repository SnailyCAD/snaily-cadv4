import { Button, Loader } from "@snailycad/ui";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { NameSearchFooterActions } from "./footer-actions";

interface Props {
  isLeo?: boolean;
  loadingState: "loading" | "error" | null;
}

export function NameSearchFooter(props: Props) {
  const currentResult = useNameSearch((state) => state.currentResult);
  const { CREATE_USER_CITIZEN_LEO } = useFeatureEnabled();
  const t = useTranslations();
  const { closeModal } = useModal();

  const showActions = (currentResult || CREATE_USER_CITIZEN_LEO) && props.isLeo;

  return (
    <footer
      className={classNames("mt-4 pt-3 flex", showActions ? "justify-between" : "justify-end")}
    >
      {showActions ? <NameSearchFooterActions isLeo={props.isLeo} /> : null}

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
