import { Bolo, ShouldDoType, BoloType } from "@snailycad/types";
import { Button } from "components/Button";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useLeoState } from "state/leoState";

interface BoloItemProps {
  idx: number;
  bolo: Bolo;
  handleEdit: (bolo: Bolo) => void;
  handleDelete: (bolo: Bolo) => void;
}

export function BoloItem({ idx, bolo, handleDelete, handleEdit }: BoloItemProps) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { activeOfficer } = useLeoState();
  const { pathname } = useRouter();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const isDispatchRoute = pathname === "/dispatch";
  const isDisabled = isDispatchRoute
    ? !hasActiveDispatchers
    : !activeOfficer || activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY;

  const { generateCallsign } = useGenerateCallsign();

  return (
    <li key={bolo.id} className="flex justify-between">
      <div className="flex">
        <span className="mr-2 text-gray-500 select-none">{idx + 1}.</span>

        <div>
          {bolo.type === BoloType.PERSON ? (
            <div id="description">
              <p className="mb-1">{bolo.description}</p>
              <span className="font-semibold">{common("name")}: </span>
              {bolo.name}
            </div>
          ) : bolo.type === BoloType.VEHICLE ? (
            <div>
              <p className="mb-1">{bolo.description}</p>
              <span className="font-semibold">{t("plate")}: </span>
              {bolo.plate?.toUpperCase() || common("none")}
              <br />
              <span className="font-semibold">{t("color")}: </span>
              {bolo.color || common("none")}
              <br />
              <span className="font-semibold">{t("model")}: </span>
              {bolo.model || common("none")}
            </div>
          ) : (
            <p className="text-justify">{bolo.description}</p>
          )}

          <p>
            <span className="font-semibold">{t("officer")}: </span>
            {bolo.officer
              ? `${generateCallsign(bolo.officer)} ${makeUnitName(bolo.officer)}`
              : t("dispatch")}
          </p>
        </div>
      </div>

      <div className="ml-2 min-w-fit">
        <Button small disabled={isDisabled} onClick={() => handleEdit(bolo)} variant="success">
          {common("edit")}
        </Button>
        <Button
          small
          className="ml-2"
          disabled={isDisabled}
          onClick={() => handleDelete(bolo)}
          variant="danger"
        >
          {common("delete")}
        </Button>
      </div>
    </li>
  );
}
