import * as React from "react";
import { RecordType } from "@snailycad/types";
import type { PostEmsFdDeclareCitizenById } from "@snailycad/types/api";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@snailycad/ui";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import useFetch from "lib/useFetch";
import { normalizeValue } from "lib/values/normalize-value";
import { ThreeDotsVertical } from "react-bootstrap-icons";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { ManageRecordModal } from "../../manage-record/manage-record-modal";
import { Permissions, usePermission } from "hooks/usePermission";

interface Props {
  isLeo?: boolean;
}

export function NameSearchFooterActions(props: Props) {
  const [type, setType] = React.useState<RecordType | null>(null);

  const { CREATE_USER_CITIZEN_LEO, LEO_EDITABLE_CITIZEN_PROFILE } = useFeatureEnabled();
  const modalState = useModal();
  const t = useTranslations();
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const hasDeclarePermissions = hasPermissions([Permissions.DeclareCitizenDead]);
  const hasManageCitizenProfilePermissions = hasPermissions([Permissions.LeoManageCitizenProfile]);

  const { currentResult, setCurrentResult } = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));

  async function handleDeclare() {
    if (!currentResult || !hasDeclarePermissions) return;

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
    modalState.openModal(modalId[type], {
      citizenName: `${currentResult.name} ${currentResult.surname}`,
      citizenId: currentResult.id,
    });
  }

  const showExtraActions = currentResult && !currentResult.isConfidential && props.isLeo;

  return (
    <div className="flex items-center">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center justify-center w-8 h-7 p-0">
            <ThreeDotsVertical
              aria-label="Options"
              className="fill-neutral-800 dark:fill-gray-300"
              width={16}
              height={16}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" sideOffset={3} alignOffset={0}>
          {CREATE_USER_CITIZEN_LEO ? (
            <DropdownMenuItem
              className="px-1.5"
              onClick={() => modalState.openModal(ModalIds.CreateOrManageCitizen)}
            >
              {t("Leo.createCitizen")}
            </DropdownMenuItem>
          ) : null}

          {showExtraActions ? (
            <>
              {hasDeclarePermissions ? (
                <DropdownMenuItem
                  size="xs"
                  onClick={handleDeclare}
                  disabled={state === "loading"}
                  variant="cancel"
                  className="px-1.5"
                >
                  {currentResult.dead ? t("Ems.declareAlive") : t("Ems.declareDead")}
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuItem
                size="xs"
                onClick={handleDeclareMissing}
                disabled={state === "loading"}
                variant="cancel"
                className="px-1.5"
              >
                {currentResult.missing ? t("Leo.declareFound") : t("Leo.declareMissing")}
              </DropdownMenuItem>

              {hasManageCitizenProfilePermissions && LEO_EDITABLE_CITIZEN_PROFILE ? (
                <DropdownMenuItem
                  disabled={state === "loading"}
                  variant="cancel"
                  className="px-1.5"
                  size="xs"
                  onClick={() => modalState.openModal(ModalIds.CreateOrManageCitizen)}
                >
                  {t("Leo.manageCitizenProfile")}
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

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
