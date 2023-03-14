import * as React from "react";
import { RecordType } from "@snailycad/types";
import type { PostEmsFdDeclareCitizenById } from "@snailycad/types/api";
import { Button } from "@snailycad/ui";
import { Dropdown } from "components/Dropdown";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import useFetch from "lib/useFetch";
import { normalizeValue } from "lib/values/normalize-value";
import { ThreeDotsVertical } from "react-bootstrap-icons";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { shallow } from "zustand/shallow";
import { ManageRecordModal } from "../../manage-record/manage-record-modal";

interface Props {
  isLeo?: boolean;
}

export function NameSearchFooterActions(props: Props) {
  const [type, setType] = React.useState<RecordType | null>(null);

  const { CREATE_USER_CITIZEN_LEO } = useFeatureEnabled();
  const { openModal } = useModal();
  const t = useTranslations();
  const { state, execute } = useFetch();
  const { currentResult, setCurrentResult } = useNameSearch(
    (state) => ({
      currentResult: state.currentResult,
      setCurrentResult: state.setCurrentResult,
    }),
    shallow,
  );

  async function handleDeclare() {
    if (!currentResult) return;

    const { json } = await execute<PostEmsFdDeclareCitizenById>({
      path: `/ems-fd/declare/${currentResult.id}`,
      method: "POST",
    });

    if (json.id) {
      setCurrentResult({ ...currentResult, ...json });
    }
  }

  async function handleDeclareMissing() {
    if (!currentResult) return;

    const { json } = await execute<PostEmsFdDeclareCitizenById>({
      path: `/search/actions/missing/${currentResult.id}`,
      method: "POST",
    });

    if (json.id) {
      setCurrentResult({ ...currentResult, ...json });
    }
  }

  function handleOpenCreateRecord(type: RecordType) {
    if (!currentResult) return;

    const modalId = {
      [RecordType.ARREST_REPORT]: ModalIds.CreateArrestReport,
      [RecordType.TICKET]: ModalIds.CreateTicket,
      [RecordType.WRITTEN_WARNING]: ModalIds.CreateWrittenWarning,
    };

    setType(type);
    openModal(modalId[type], {
      citizenName: `${currentResult.name} ${currentResult.surname}`,
      citizenId: currentResult.id,
    });
  }

  const showExtraActions = currentResult && !currentResult.isConfidential && props.isLeo;

  return (
    <div className="flex items-center">
      <Dropdown
        extra={{ maxWidth: 200 }}
        sideOffset={3}
        alignOffset={0}
        modal={false}
        trigger={
          <Button>
            <ThreeDotsVertical />
          </Button>
        }
      >
        {CREATE_USER_CITIZEN_LEO ? (
          <Dropdown.Item className="px-1.5" onPress={() => openModal(ModalIds.CreateCitizen)}>
            {t("Leo.createCitizen")}
          </Dropdown.Item>
        ) : null}

        {showExtraActions ? (
          <>
            <Dropdown.Item
              size="xs"
              type="button"
              onPress={handleDeclare}
              disabled={state === "loading"}
              variant="cancel"
              className="px-1.5"
            >
              {currentResult.dead ? t("Ems.declareAlive") : t("Ems.declareDead")}
            </Dropdown.Item>

            <Dropdown.Item
              size="xs"
              type="button"
              onPress={handleDeclareMissing}
              disabled={state === "loading"}
              variant="cancel"
              className="px-1.5"
            >
              {currentResult.missing ? t("Leo.declareFound") : t("Leo.declareMissing")}
            </Dropdown.Item>
          </>
        ) : null}
      </Dropdown>

      {showExtraActions ? (
        <div className="ml-2">
          {Object.values(RecordType).map((type) => (
            <Button
              key={type}
              type="button"
              onPress={() => handleOpenCreateRecord(type)}
              variant="cancel"
              className="px-1.5"
            >
              {t(`Leo.${normalizeValue(`CREATE_${type}`)}`)}
            </Button>
          ))}
        </div>
      ) : null}

      {type ? (
        <ManageRecordModal
          onCreate={(record) => {
            if (!currentResult || currentResult.isConfidential) return;

            setCurrentResult({
              ...currentResult,
              Record: [...currentResult.Record, record],
            });
          }}
          onClose={() => setType(null)}
          type={type}
        />
      ) : null}
    </div>
  );
}
