import { defaultPermissions } from "@snailycad/permissions";
import type { GetCitizensData } from "@snailycad/types/api";
import { buttonVariants } from "@snailycad/ui";
import { ImageWrapper } from "components/shared/image-wrapper";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import { usePermission } from "hooks/usePermission";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PersonFill } from "react-bootstrap-icons";

interface Props {
  citizen: GetCitizensData["citizens"][number];
}

export function CitizenListItem({ citizen }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Citizen");
  const { SOCIAL_SECURITY_NUMBERS, COMMON_CITIZEN_CARDS } = useFeatureEnabled();
  const { makeImageUrl } = useImageUrl();
  const { hasPermissions } = usePermission();
  const hasLeoPermissions = hasPermissions(
    defaultPermissions.defaultLeoPermissions,
    (u) => u.isLeo,
  );

  return (
    <li className="flex items-center justify-between bg-gray-200 p-3 dark:shadow-md rounded-md border border-gray-400 dark:border-quinary dark:bg-tertiary">
      <div className="flex items-center space-x-3">
        {citizen.imageId ? (
          <ImageWrapper
            quality={80}
            placeholder={citizen.imageBlurData ? "blur" : "empty"}
            blurDataURL={citizen.imageBlurData ?? undefined}
            alt={`${citizen.name} ${citizen.surname}`}
            draggable={false}
            className="object-cover rounded-md w-14 h-14"
            src={makeImageUrl("citizens", citizen.imageId)!}
            loading="lazy"
            width={56}
            height={56}
            fallback={<PersonFill className="w-12 h-12 text-gray-500/60" />}
          />
        ) : (
          <PersonFill className="w-12 h-12 text-gray-500/60" />
        )}

        <div className="flex flex-col">
          <p className="text-xl font-semibold capitalize">
            {citizen.name} {citizen.surname}
          </p>

          {SOCIAL_SECURITY_NUMBERS ? (
            <p className="text-neutral-600 dark:text-neutral-300">
              <strong>SSN:</strong> {citizen.socialSecurityNumber}
            </p>
          ) : null}
          {COMMON_CITIZEN_CARDS && hasLeoPermissions ? (
            <p className="text-neutral-600 dark:text-neutral-300">
              <strong>User:</strong> {citizen.user?.username ?? common("none")}
            </p>
          ) : null}
        </div>
      </div>

      <Link
        href={`/citizen/${citizen.id}`}
        className={`rounded-md transition-all p-1 px-3 ${buttonVariants.default}`}
      >
        {t("viewCitizen")}
      </Link>
    </li>
  );
}
