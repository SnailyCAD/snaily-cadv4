import * as React from "react";
import { PersonCircle } from "react-bootstrap-icons";
import { logout } from "lib/auth";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useAuth } from "context/AuthContext";
import { classNames } from "lib/classNames";
import { Dropdown } from "components/Dropdown";
import { Button } from "components/Button";

export function AccountDropdown() {
  const [isOpen, setOpen] = React.useState(false);

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
    <Dropdown
      alignOffset={0}
      side="left"
      open={isOpen}
      onOpenChange={setOpen}
      trigger={
        <Button
          variant={null}
          className={classNames(
            "inline-flex justify-center w-full px-2 py-2 text-sm font-medium text-neutral-800 dark:text-white bg-transparent rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-secondary focus:outline-none",
            isOpen && "bg-gray-200 dark:bg-secondary",
          )}
        >
          <span className="mr-2.5"> {user ? user.username : null}</span>

          <PersonCircle className="text-neutral-800 dark:text-gray-300" width={20} height={20} />
        </Button>
      }
    >
      <Dropdown.LinkItem href="/account">{t("account")}</Dropdown.LinkItem>
      <hr className="my-2 mx-2 border-t dark:border-quinary" />
      <Dropdown.Item onClick={handleLogout}>{t("logout")}</Dropdown.Item>
      <hr className="my-2 mx-2 border-t dark:border-quinary" />

      {cad?.version ? (
        <div className="px-1 py-1">
          <p className="text-gray-900 dark:text-gray-200 block w-full px-3 py-1.5 text-base cursor-default">
            v{cad.version.currentVersion}
            <br /> {cad.version.currentCommitHash}
          </p>
        </div>
      ) : null}
    </Dropdown>
  );
}
