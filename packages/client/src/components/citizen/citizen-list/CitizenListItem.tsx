import type { Citizen, User } from "@snailycad/types";
import { buttonVariants } from "components/Button";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PersonFill } from "react-bootstrap-icons";

interface Props {
  citizen: Citizen & { user?: Pick<User, "username"> };
}

export function CitizenListItem({ citizen }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Citizen");
  const { COMMON_CITIZEN_CARDS } = useFeatureEnabled();
  const { makeImageUrl } = useImageUrl();

  return (
    <li className="flex items-center justify-between p-3 bg-gray-200 rounded-md dark:bg-gray-2">
      <div className="flex items-center space-x-3">
        {citizen.imageId ? (
          <img
            draggable={false}
            className="object-cover rounded-full w-14 h-14"
            src={makeImageUrl("citizens", citizen.imageId)}
          />
        ) : (
          <PersonFill className="w-12 h-12 text-gray-500/60" />
        )}

        <div className="flex flex-col">
          <p className="text-xl font-semibold">
            {citizen.name} {citizen.surname}
          </p>

          {COMMON_CITIZEN_CARDS ? <p>{citizen.user?.username ?? common("none")}</p> : null}
        </div>
      </div>

      <Link href={`/citizen/${citizen.id}`}>
        <a
          href={`/citizen/${citizen.id}`}
          className={`rounded-md transition-all p-1 px-3 ${buttonVariants.default}`}
        >
          {t("viewCitizen")}
        </a>
      </Link>
    </li>
  );
}
