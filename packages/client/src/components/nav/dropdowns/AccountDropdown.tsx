import * as React from "react";
import { Menu, Transition } from "@headlessui/react";
import { PersonCircle } from "react-bootstrap-icons";
import { logout } from "lib/auth";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useAuth } from "context/AuthContext";
import { classNames } from "lib/classNames";
import Link from "next/link";

const ListLink = React.forwardRef<HTMLAnchorElement, JSX.IntrinsicElements["a"]>((props, ref) => {
  const { href, children, ...rest } = props;
  return (
    <Link href={href!}>
      <a {...rest} ref={ref}>
        {children}
      </a>
    </Link>
  );
});

export function AccountDropdown() {
  const { user, setUser, cad } = useAuth();
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
        <div>
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
                      <ListLink
                        className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg rounded-md w-full px-3 py-1.5 text-sm transition-all"
                        href="/account"
                      >
                        {t("account")}
                      </ListLink>
                    </Menu.Item>
                  </div>

                  <div className="px-1 py-1">
                    <Menu.Item>
                      <button
                        onClick={handleLogout}
                        className="text-red-500 text-left hover:bg-red-500 hover:text-black rounded-md w-full px-3 py-1.5 text-sm transition-all"
                      >
                        {t("logout")}
                      </button>
                    </Menu.Item>
                  </div>
                </>
              ) : (
                <div className="px-1 py-1">
                  <Menu.Item>
                    <ListLink
                      className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg rounded-md w-full px-3 py-1.5 text-sm transition-all"
                      href="/auth/login"
                    >
                      {t("login")}
                    </ListLink>
                  </Menu.Item>

                  <Menu.Item>
                    <ListLink
                      className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg rounded-md w-full px-3 py-1.5 text-sm transition-all"
                      href="/auth/register"
                    >
                      {t("register")}
                    </ListLink>
                  </Menu.Item>
                </div>
              )}

              {cad?.version ? (
                <div className="px-1 py-1">
                  <p className="text-gray-900 dark:text-gray-200 block w-full px-3 py-1.5 text-sm cursor-default">
                    v{cad.version.currentVersion}
                    <br /> {cad.version.currentCommitHash}
                  </p>
                </div>
              ) : null}
            </Menu.Items>
          </Transition>
        </div>
      )}
    </Menu>
  );
}
