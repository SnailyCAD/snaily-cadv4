import * as React from "react";
import Link from "next/link";
import { useAuth } from "context/AuthContext";
import { useRouter } from "next/router";
import { classNames } from "lib/classNames";
import { CitizenDropdown } from "./dropdowns/citizen-dropdown";
import { OfficerDropdown } from "./dropdowns/officer-dropdown";
import { EmsFdDropdown } from "./dropdowns/ems-fd-dropdown";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { TowDropdown } from "./dropdowns/tow-dropdown";
import { DispatchDropdown } from "./dropdowns/dispatch-dropdown";
import { useTranslations } from "next-intl";
import { useImageUrl } from "hooks/useImageUrl";
import { useViewport } from "@casperiv/useful/hooks/useViewport";
import { AccountDropdown } from "./dropdowns/account-dropdown";
import Head from "next/head";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { ImageWrapper } from "components/shared/image-wrapper";
import { AdminLink } from "./dropdowns/admin-link";

interface Props {
  maxWidth?: string;
  isAccountPending?: boolean;
}

export function Nav({ maxWidth, isAccountPending }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const { user, cad } = useAuth();
  const { TOW, COURTHOUSE } = useFeatureEnabled();
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);
  const { hasPermissions } = usePermission();

  const { makeImageUrl } = useImageUrl();
  const url = cad && makeImageUrl("cad", cad.logoId);
  const viewport = useViewport();

  React.useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  React.useEffect(() => {
    if (viewport > 900) {
      setMenuOpen(false);
    }
  }, [viewport]);

  return (
    <nav className="bg-white dark:bg-tertiary shadow-sm sticky top-0 z-30">
      <div style={{ maxWidth: maxWidth ?? "100rem" }} className="mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex flex-col nav:hidden w-7"
            aria-label="Toggle menu"
          >
            <span className="my-0.5 rounded-md h-0.5 w-full bg-neutral-800 dark:bg-white " />
            <span className="my-0.5 rounded-md h-0.5 w-full bg-neutral-800 dark:bg-white " />
            <span className="my-0.5 rounded-md h-0.5 w-full bg-neutral-800 dark:bg-white " />
          </button>

          <div className="relative flex items-center nav:space-x-7">
            <h1 className="text-2xl hidden nav:block">
              <a
                href="/citizen"
                className="flex items-center gap-2 py-3 font-bold text-gray-800 dark:text-white"
              >
                {url ? (
                  <>
                    <Head>
                      <link rel="shortcut icon" href={url} />
                      <meta name="og:image" content={url} />
                    </Head>
                    <ImageWrapper
                      quality={80}
                      alt={cad?.name || "SnailyCAD"}
                      width={30}
                      height={30}
                      className="max-h-[30px] min-w-[30px]"
                      src={url}
                      loading="lazy"
                    />
                  </>
                ) : null}
                {cad?.name || "SnailyCAD"}
              </a>
            </h1>

            {isAccountPending ? null : (
              <div
                role="list"
                className={classNames(
                  "nav:flex",
                  menuOpen
                    ? "grid place-content-center fixed top-[3.6rem] left-0 bg-white dark:bg-tertiary w-screen space-y-2 py-3 animate-enter"
                    : "hidden nav:flex-row space-x-1 items-center",
                )}
              >
                <CitizenDropdown />

                {hasPermissions([Permissions.ViewTowCalls, Permissions.ManageTowCalls]) && TOW ? (
                  <TowDropdown />
                ) : null}

                {hasPermissions(defaultPermissions.defaultLeoPermissions) ? (
                  <OfficerDropdown />
                ) : null}

                {hasPermissions([Permissions.EmsFd]) ? <EmsFdDropdown /> : null}

                {hasPermissions([Permissions.LiveMap, Permissions.Dispatch]) ? (
                  <DispatchDropdown />
                ) : null}

                {user && COURTHOUSE ? (
                  <Link
                    role="listitem"
                    href="/courthouse"
                    className={classNames(
                      "p-1 nav:px-2 text-gray-700 dark:text-gray-200 transition duration-300",
                      isActive("/courthouse") && "font-semibold",
                    )}
                  >
                    {t("courthouse")}
                  </Link>
                ) : null}

                {hasPermissions([
                  ...defaultPermissions.allDefaultAdminPermissions,
                  ...defaultPermissions.defaultCourthousePermissions,
                  Permissions.ManageAwardsAndQualifications,
                ]) ? (
                  <AdminLink />
                ) : null}
              </div>
            )}
          </div>

          <div>
            <AccountDropdown isAccountPending={isAccountPending} />
          </div>
        </div>
      </div>
    </nav>
  );
}
