import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { ModalIds } from "types/ModalIds";
import { TabsContent } from "components/shared/TabList";
import { Button } from "components/Button";
import type { Citizen, User } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Table } from "components/shared/Table";
import { Select } from "components/form/Select";
import Link from "next/link";
import { FullDate } from "components/shared/FullDate";

type CitizenWithUser = Citizen & {
  user: User | null;
};

interface Props {
  citizens: CitizenWithUser[];
  setCitizens: React.Dispatch<React.SetStateAction<CitizenWithUser[]>>;
}

export function AllCitizensTab({ citizens, setCitizens }: Props) {
  const [search, setSearch] = React.useState("");
  const [tempValue, setTempValue] = React.useState<CitizenWithUser | null>(null);
  const [reason, setReason] = React.useState("");
  const [userFilter, setUserFilter] = React.useState<string | null>(null);
  const users = React.useMemo(() => makeUsersList(citizens), [citizens]);

  const reasonRef = React.useRef<HTMLInputElement>(null);

  const { state, execute } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();

  const tCitizen = useTranslations("Citizen");
  const t = useTranslations("Management");
  const common = useTranslations("Common");

  function handleDeleteClick(value: CitizenWithUser) {
    setTempValue(value);
    openModal(ModalIds.AlertDeleteCitizen);
  }

  async function handleDelete() {
    if (!tempValue) return;

    if (!reason.trim() && reasonRef.current) {
      return reasonRef.current.focus();
    }

    const { json } = await execute(`/admin/manage/citizens/${tempValue.id}`, {
      method: "DELETE",
      data: { reason },
    });

    if (json) {
      setCitizens((p) => p.filter((v) => v.id !== tempValue.id));
      setTempValue(null);
      closeModal(ModalIds.AlertDeleteCitizen);
    }
  }

  return (
    <TabsContent value="allCitizens">
      {citizens.length <= 0 ? (
        <p className="mt-5">{t("noCitizens")}</p>
      ) : (
        <ul className="mt-5">
          <div className="flex items-center gap-2">
            <FormField label={common("search")} className="w-full">
              <Input
                placeholder="john doe"
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                className=""
              />
            </FormField>

            <FormField className="w-40" label="Filter">
              <Select
                isClearable
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                values={users.map((u) => ({
                  label: u.username,
                  value: u.id,
                }))}
              />
            </FormField>
          </div>

          <Table
            filter={search}
            data={citizens
              .filter((v) => (userFilter ? String(v.userId) === userFilter : true))
              .map((citizen) => ({
                name: `${citizen.name} ${citizen.surname}`,
                dateOfBirth: <FullDate onlyDate>{citizen.dateOfBirth}</FullDate>,
                gender: citizen.gender.value,
                ethnicity: citizen.ethnicity.value,
                hairColor: citizen.hairColor,
                eyeColor: citizen.eyeColor,
                weight: citizen.weight,
                height: citizen.height,
                user: citizen.user?.username ?? "No user",
                actions: (
                  <>
                    <Link href={`/admin/manage/citizens/${citizen.id}`}>
                      <a>
                        <Button variant="success" small>
                          {common("edit")}
                        </Button>
                      </a>
                    </Link>
                    <Button
                      className="ml-2"
                      small
                      variant="danger"
                      onClick={() => handleDeleteClick(citizen)}
                    >
                      {common("delete")}
                    </Button>
                  </>
                ),
              }))}
            columns={[
              { Header: tCitizen("fullName"), accessor: "name" },
              { Header: tCitizen("dateOfBirth"), accessor: "dateOfBirth" },
              { Header: tCitizen("gender"), accessor: "gender" },
              { Header: tCitizen("ethnicity"), accessor: "ethnicity" },
              { Header: tCitizen("hairColor"), accessor: "hairColor" },
              { Header: tCitizen("eyeColor"), accessor: "eyeColor" },
              { Header: tCitizen("weight"), accessor: "weight" },
              { Header: tCitizen("height"), accessor: "height" },
              { Header: "User", accessor: "user" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        </ul>
      )}

      <Modal
        title={tCitizen("deleteCitizen")}
        onClose={() => closeModal(ModalIds.AlertDeleteCitizen)}
        isOpen={isOpen(ModalIds.AlertDeleteCitizen)}
      >
        <div>
          <p className="my-3">
            {tCitizen.rich("alert_deleteCitizen", {
              citizen: tempValue && `${tempValue.name} ${tempValue.surname}`,
              span: (children) => {
                return <span className="font-semibold">{children}</span>;
              },
            })}
          </p>
          <FormField label="Reason">
            <Input ref={reasonRef} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            variant="cancel"
            disabled={state === "loading"}
            onClick={() => closeModal(ModalIds.AlertDeleteCitizen)}
          >
            {common("cancel")}
          </Button>
          <Button
            disabled={state === "loading"}
            className="flex items-center"
            variant="danger"
            onClick={handleDelete}
          >
            {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
            {common("delete")}
          </Button>
        </div>
      </Modal>
    </TabsContent>
  );
}

function makeUsersList(citizens: CitizenWithUser[]) {
  const list = new Map<string, { id: string; username: string }>();
  const arr = [];

  for (const citizen of citizens) {
    const obj = {
      id: String(citizen.userId),
      username: citizen.user?.username ?? "No User",
    };

    if (list.has(String(citizen.userId))) continue;
    list.set(String(citizen.userId), obj);
    arr.push(obj);
  }

  return arr;
}
