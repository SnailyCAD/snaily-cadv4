import { defaultPermissions } from "@snailycad/permissions";
import { Bolo, ShouldDoType, BoloType, Rank } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { FullDate } from "components/shared/FullDate";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { usePermission } from "hooks/usePermission";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useLeoState } from "state/leoState";

const STOLEN_TEXT = "stolen" as const;
interface BoloItemProps {
  idx: number;
  bolo: Bolo;
  handleEdit(bolo: Bolo): void;
  handleDelete(bolo: Bolo): void;
}

export function BoloItem({ idx, bolo, handleDelete, handleEdit }: BoloItemProps) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { activeOfficer } = useLeoState();
  const { pathname } = useRouter();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(
    defaultPermissions.allDefaultAdminPermissions,
    (u) => u.rank !== Rank.USER,
  );

  const isDispatchRoute = pathname === "/dispatch";
  const isDisabled = isAdmin
    ? false
    : isDispatchRoute
    ? !hasActiveDispatchers
    : !activeOfficer || activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY;

  const { generateCallsign } = useGenerateCallsign();

  return (
    <>
      <div className="flex">
        <span className="mr-2 text-neutral-700 dark:text-gray-400 select-none">{idx + 1}.</span>

        <div>
          {bolo.type === BoloType.PERSON ? (
            <div id="description">
              <span className="font-semibold">{common("name")}: </span>
              {bolo.name}
              <br />
              <p className="mb-1">{bolo.description}</p>
            </div>
          ) : bolo.type === BoloType.VEHICLE ? (
            <div>
              <span className="font-semibold">{t("Leo.model")}: </span>
              {bolo.model || common("none")}
              <br />
              <span className="font-semibold">{t("Leo.plate")}: </span>
              {bolo.plate?.toUpperCase() || common("none")}
              <br />
              <span className="font-semibold">{t("Leo.color")}: </span>
              {bolo.color || common("none")}
              <br />
              <p className="mb-1">
                {bolo.description === STOLEN_TEXT ? t("Bolos.stolen") : bolo.description}
              </p>
            </div>
          ) : (
            <p className="text-justify">{bolo.description}</p>
          )}

          <p>
            <span className="font-semibold">{t("Leo.officer")}: </span>
            {bolo.officer
              ? `${generateCallsign(bolo.officer)} ${makeUnitName(bolo.officer)}`
              : t("Leo.dispatch")}
          </p>

          <div>
            <span className="font-semibold">{common("createdAt")}: </span>
            <FullDate side="top" onlyDate>
              {bolo.createdAt}
            </FullDate>
          </div>
        </div>
      </div>
      <div className="ml-2 min-w-fit">
        <Button size="xs" disabled={isDisabled} onPress={() => handleEdit(bolo)} variant="success">
          {common("edit")}
        </Button>
        <Button
          size="xs"
          className="ml-2"
          disabled={isDisabled}
          onPress={() => handleDelete(bolo)}
          variant="danger"
        >
          {common("delete")}
        </Button>
      </div>
    </>
  );
}
