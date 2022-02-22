import * as React from "react";
import { Menu, Transition } from "@headlessui/react";
import { PersonCircle } from "react-bootstrap-icons";
import Link from "next/link";
import { useAuth } from "src/context/AuthContext";
import { logout } from "lib/auth";
import { useRouter } from "next/router";
import { classNames } from "lib/classNames";
import { CitizenDropdown } from "./dropdowns/CitizenDropdown";
import { OfficerDropdown } from "./dropdowns/OfficerDropdown";
import { EmsFdDropdown } from "./dropdowns/EmsFdDropdown";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { TowDropdown } from "./dropdowns/TowDropdown";
import { DispatchDropdown } from "./dropdowns/DispatchDropdown";
import { useTranslations } from "next-intl";
import { useImageUrl } from "hooks/useImageUrl";
import { useViewport } from "@casper124578/useful/hooks/useViewport";
import Head from "next/head";

interface Props {
  maxWidth?: string;
}

export function Nav({ maxWidth }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const { user, cad } = useAuth();
  const { TOW, COURTHOUSE } = useFeatureEnabled();
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);

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
    <nav className="bg-white dark:bg-[#171717] shadow-sm sticky top-0 z-30">
      <div style={{ maxWidth: maxWidth ?? "100rem" }} className="mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex flex-col nav:hidden w-7">
            <span className="my-0.5 rounded-md h-0.5 w-full bg-white " />
            <span className="my-0.5 rounded-md h-0.5 w-full bg-white " />
            <span className="my-0.5 rounded-md h-0.5 w-full bg-white " />
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
                    </Head>
                    <img
                      alt={cad?.name || "SnailyCAD"}
                      width={30}
                      height={30}
                      className="max-h-[30px] min-w-[30px]"
                      src={url}
                    />
                  </>
                ) : null}
                {cad?.name || "SnailyCAD"}
              </a>
            </h1>

            <ul
              className={classNames(
                "nav:flex",
                menuOpen
                  ? "grid place-content-center fixed top-[3.6rem] left-0 bg-white dark:bg-[#171717] w-screen space-y-2 py-3 animate-enter"
                  : "hidden nav:flex-row space-x-1 items-center",
              )}
            >
              <CitizenDropdown />

              {user?.isTow && TOW ? <TowDropdown /> : null}

              {user?.isLeo ? <OfficerDropdown /> : null}

              {user?.isEmsFd ? <EmsFdDropdown /> : null}

              {user?.isDispatch ? <DispatchDropdown /> : null}

              {COURTHOUSE ? (
                <Link href="/courthouse">
                  <a
                    className={classNames(
                      "p-1 nav:px-2 text-gray-700 dark:text-gray-200 transition duration-300",
                      isActive("/courthouse") && "font-semibold",
                    )}
                  >
                    {t("courthouse")}
                  </a>
                </Link>
              ) : null}

              {user && user.rank !== "USER" ? (
                <Link href="/admin">
                  <a
                    className={classNames(
                      "p-1 nav:px-2 text-gray-700 dark:text-gray-200 transition duration-300",
                      isActive("/admin") && "font-semibold",
                    )}
                  >
                    {t("admin")}
                  </a>
                </Link>
              ) : null}
            </ul>
          </div>

          <div>
            <NavDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavDropdown() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("Nav");

  async function handleLogout() {
    const success = await logout();
    if (success) {
      router.push("/auth/login");
      setUser(null);
    }
  }

  return (
    <Menu as="div" className="relative z-50 inline-block text-left">
      {({ open }) => (
        <>
          <Menu.Button
            className={classNames(
              "inline-flex justify-center w-full px-2 py-2 text-sm font-medium text-neutral-800 dark:text-white bg-transparent rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-dark-bright focus:outline-none",
              open && "bg-gray-200 dark:bg-dark-bright",
            )}
          >
            <span className="mr-2.5"> {user ? user.username : null}</span>

            <PersonCircle className="text-dark-bg dark:text-gray-300" width={20} height={20} />
          </Menu.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 w-32 mt-1 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-xl dark:bg-dark-bright dark:divide-dark-bg focus:outline-none">
              {user ? (
                <>
                  <div className="px-1 py-1">
                    <Menu.Item>
                      <Link href="/account">
                        <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                          {t("account")}
                        </a>
                      </Link>
                    </Menu.Item>
                  </div>

                  <div className="px-1 py-1">
                    <Menu.Item>
                      <button
                        onClick={handleLogout}
                        className="text-red-500 text-left hover:bg-red-500 hover:text-black group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all"
                      >
                        {t("logout")}
                      </button>
                    </Menu.Item>
                  </div>
                </>
              ) : (
                <div className="px-1 py-1 ">
                  <Menu.Item>
                    <Link href="/auth/login">
                      <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                        {t("login")}
                      </a>
                    </Link>
                  </Menu.Item>
                  <Menu.Item>
                    <Link href="/auth/register">
                      <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                        {t("register")}
                      </a>
                    </Link>
                  </Menu.Item>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}
