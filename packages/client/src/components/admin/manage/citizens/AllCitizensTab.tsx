import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { ModalIds } from "types/ModalIds";
import { Disclosure, Tab } from "@headlessui/react";
import { Button } from "components/Button";
import { Citizen, User } from "types/prisma";
import { formatCitizenAddress } from "lib/utils";
import { useTranslations } from "next-intl";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";

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

    try {
      const { json } = await execute(`/admin/manage/citizens/${tempValue.id}`, {
        method: "DELETE",
        data: { reason },
      });

      if (json) {
        setCitizens((p) => p.filter((v) => v.id !== tempValue.id));
        setTempValue(null);
        closeModal(ModalIds.AlertDeleteCitizen);
      }
    } catch (err) {
      console.log({ err });
    }
  }

  return (
    <Tab.Panel>
      {citizens.length <= 0 ? (
        <p className="mt-5">{t("noCitizens")}</p>
      ) : (
        <ul className="mt-5">
          <FormField label={common("search")} className="my-2">
            <Input
              placeholder="john doe"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
              className=""
            />
          </FormField>

          {citizens.filter(handleFilter.bind(null, search)).map((citizen, idx) => (
            <li
              className="flex flex-col w-full p-2 px-4 my-1 bg-gray-200 rounded-md dark:bg-gray-2"
              key={citizen.id}
            >
              <Disclosure>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 select-none">{idx + 1}.</span>
                    <span className="ml-2">
                      {citizen.name} {citizen.surname}
                    </span>
                  </div>

                  <div>
                    <Disclosure.Button as={Button}>{t("viewInfo")}</Disclosure.Button>
                    <Button
                      onClick={() => handleDeleteClick(citizen)}
                      variant="danger"
                      className="ml-2"
                    >
                      {common("delete")}
                    </Button>
                  </div>
                </div>

                <Disclosure.Panel className="px-5">
                  <p>
                    <span className="font-semibold">{tCitizen("fullName")}: </span>
                    {citizen.name} {citizen.surname}
                  </p>
                  <p>
                    <span className="font-semibold">{tCitizen("gender")}: </span>
                    {citizen.gender.value}
                  </p>
                  <p>
                    <span className="font-semibold">{tCitizen("ethnicity")}: </span>
                    {citizen.ethnicity.value}
                  </p>
                  <p>
                    <span className="font-semibold">{tCitizen("hairColor")}: </span>
                    {citizen.hairColor}
                  </p>
                  <p>
                    <span className="font-semibold">{tCitizen("eyeColor")}: </span>
                    {citizen.eyeColor}
                  </p>
                  <p>
                    <span className="font-semibold">{tCitizen("weight")}: </span>
                    {citizen.weight}
                  </p>
                  <p>
                    <span className="font-semibold">{tCitizen("height")}: </span>
                    {citizen.height}
                  </p>
                  <p>
                    <span className="font-semibold">{tCitizen("address")}: </span>
                    {formatCitizenAddress(citizen)}
                  </p>
                  <p>
                    <span className="font-semibold">{tCitizen("phoneNumber")}: </span>
                    {citizen.phoneNumber ?? common("none")}
                  </p>
                  <p>
                    <span className="font-semibold">{t("user")}: </span>
                    {citizen.user?.username ?? common("none")}
                  </p>
                </Disclosure.Panel>
              </Disclosure>
            </li>
          ))}
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
    </Tab.Panel>
  );
}

function handleFilter(search: string, citizen: Citizen) {
  if (!search) {
    return true;
  }

  const { name, surname } = citizen;

  if (`${name} ${surname}`.toLowerCase() === search.toLowerCase()) {
    return true;
  }

  return (
    name.toLowerCase().includes(search.toLowerCase()) ||
    surname.toLowerCase().includes(search.toLowerCase())
  );
}
