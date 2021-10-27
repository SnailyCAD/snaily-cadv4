import { Tab } from "@headlessui/react";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { User } from "types/prisma";
import { useTranslations } from "use-intl";

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const PendingUsersTab = ({ setUsers, users }: Props) => {
  const t = useTranslations("Management");
  const { execute } = useFetch();

  async function handleAcceptOrDecline(user: Pick<User, "id">, type: "accept" | "decline") {
    const { json } = await execute(`/admin/manage/users/pending/${user.id}/${type}`, {
      method: "POST",
    });

    if (json) {
      setUsers((users) =>
        users.map((v) =>
          v.id === user.id
            ? { ...v, whitelistStatus: type === "accept" ? "ACCEPTED" : "DECLINED" }
            : v,
        ),
      );
    }
  }

  return (
    <Tab.Panel>
      <h3 className="text-xl font-semibold my-4">{t("pendingUsers")}</h3>

      <ul className="">
        {users.map((user, idx) => (
          <li className="my-1 bg-gray-200 py-3 px-4 rounded-md w-full flex flex-col" key={user.id}>
            <div className="flex items-center justify-between">
              <div>
                <span className="select-none text-gray-500">{idx + 1}.</span>
                <span className="ml-2">{user.username}</span>
              </div>

              <div>
                <Button
                  onClick={() => handleAcceptOrDecline(user, "accept")}
                  className="mr-2"
                  variant="success"
                >
                  Accept
                </Button>
                <Button onClick={() => handleAcceptOrDecline(user, "decline")} variant="danger">
                  Decline
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Tab.Panel>
  );
};
