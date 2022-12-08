import type { EmsFdDeputy, Officer } from "@snailycad/types";
import { isUnitOfficer } from "@snailycad/utils";
import { useImageUrl } from "hooks/useImageUrl";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function OfficerRank({ unit }: { unit: Officer | EmsFdDeputy }) {
  const common = useTranslations("Common");
  const rank = unit.rank?.value ?? common("none");
  const { makeImageUrl } = useImageUrl();
  const imgUrl = makeImageUrl("values", unit.rank?.officerRankImageId ?? null);

  if (!isUnitOfficer(unit)) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{rank}</>;
  }

  return (
    <span className="flex flex-row gap-2 pr-4">
      {imgUrl ? (
        <Image
          alt={rank}
          loading="lazy"
          src={imgUrl}
          width={25}
          height={25}
          className="object-cover"
        />
      ) : null}
      {rank}
    </span>
  );
}
