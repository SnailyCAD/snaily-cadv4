import * as React from "react";
import { Tab } from "@headlessui/react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/inputs/Input";
import { v4 } from "uuid";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import type { Citizen, User } from "types/prisma";
import { X } from "react-bootstrap-icons";

interface Props {
  onSuccess(citizens: (Citizen & { user: User | null })[]): void;
}

export function AdvancedCitizensTab({ onSuccess }: Props) {
  const [citizens, setCitizens] = React.useState<Record<string, any>>(createInitialCitizen());
  const { gender, ethnicity } = useValues();
  const { state, execute } = useFetch();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const { json } = await execute("/admin/manage/citizens/import", {
      data: Object.values(citizens),
      method: "POST",
    });

    if (Array.isArray(json)) {
      onSuccess(json);
      setCitizens(createInitialCitizen());
    }
  }

  function handleRemoveItem(id: string) {
    setCitizens((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: foo, ...rest } = prev;

      return rest;
    });
  }

  function handleChange(name: string, id: string, event: any) {
    setCitizens((prev) => {
      const citizen = citizens[id];

      if (citizen) {
        const value = event.target.value;
        citizen[name] = value;
      }

      return prev;
    });
  }

  return (
    <Tab.Panel className="mt-3">
      <p className="my-2 dark:text-gray-300">
        Here you can mass import citizens that can may not be connected to a registered user
        account.
      </p>

      <form className="mt-5" onSubmit={onSubmit}>
        {Object.entries(citizens).map(([id, value]) => {
          return (
            <FormRow flexLike key={id}>
              <div className="grid place-items-center">
                <Button
                  type="button"
                  className="px-1"
                  variant="transparent"
                  onClick={() => handleRemoveItem(id)}
                >
                  <X width={20} height={20} aria-label="Remove item" />
                </Button>
              </div>

              <FormField className="w-full" label="Name">
                <Input defaultValue={value.name} onBlur={(e) => handleChange("name", id, e)} />
              </FormField>
              <FormField className="w-full" label="Surname">
                <Input
                  defaultValue={value.surname}
                  onBlur={(e) => handleChange("surname", id, e)}
                />
              </FormField>
              <FormField className="w-full" label="Date of Birth">
                <Input
                  type="date"
                  defaultValue={value.dateOfBirth}
                  onBlur={(e) => handleChange("dateOfBirth", id, e)}
                />
              </FormField>
              <FormField className="w-full" label="Gender">
                <Select
                  value={value.gender}
                  onChange={(event) => handleChange("gender", id, event)}
                  values={gender.values.map((gender) => ({
                    value: gender.id,
                    label: gender.value,
                  }))}
                />
              </FormField>
              <FormField className="w-full" label="Ethnicity">
                <Select
                  value={value.ethnicity}
                  onChange={(event) => handleChange("ethnicity", id, event)}
                  values={ethnicity.values.map((ethnicity) => ({
                    value: ethnicity.id,
                    label: ethnicity.value,
                  }))}
                />
              </FormField>
            </FormRow>
          );
        })}

        <div className="flex items-center justify-end gap-2 mt-3">
          <Button
            type="button"
            onClick={() => {
              setCitizens((p) => ({ ...p, ...createInitialCitizen() }));
            }}
          >
            Add citizen
          </Button>

          <Button className="flex items-center gap-2" disabled={state === "loading"} type="submit">
            {state === "loading" ? <Loader /> : null}
            Submit
          </Button>
        </div>
      </form>
    </Tab.Panel>
  );
}

function createInitialCitizen() {
  return {
    [v4()]: { name: "", surname: "", gender: "", ethnicity: "", dateOfBirth: "" },
  };
}
