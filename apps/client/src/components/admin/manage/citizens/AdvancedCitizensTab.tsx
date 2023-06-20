import * as React from "react";
import { Button, Loader, TextField, FormRow } from "@snailycad/ui";
import { v4 } from "uuid";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import { X } from "react-bootstrap-icons";
import { ImportModal } from "components/admin/import/ImportModal";
import { ModalIds } from "types/modal-ids";
import type { PostImportCitizensData } from "@snailycad/types/api";
import { useTranslations } from "use-intl";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { ValueType } from "@snailycad/types";

export function AdvancedCitizensTab() {
  const [citizens, setCitizens] = React.useState<Record<string, any>>(createInitialCitizen());
  const { gender, ethnicity } = useValues();
  const { state, execute } = useFetch();
  const t = useTranslations();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const { json } = await execute<PostImportCitizensData>({
      path: "/admin/import/citizens",
      data: Object.values(citizens),
      method: "POST",
    });

    if (Array.isArray(json)) {
      setCitizens(createInitialCitizen());
    }
  }

  function handleRemoveItem(id: string) {
    setCitizens((prev) => {
      const { [id]: _foo, ...rest } = prev;

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
    <div className="mt-5">
      <form className="mt-10" onSubmit={onSubmit}>
        {Object.entries(citizens).map(([id, value]) => {
          return (
            <FormRow key={id}>
              <div className="grid place-items-center">
                <Button
                  type="button"
                  className="px-2 py-2 mt-3.5"
                  onPress={() => handleRemoveItem(id)}
                >
                  <X width={20} height={20} aria-label="Remove item" />
                </Button>
              </div>

              <TextField
                className="w-full"
                label={t("Citizen.name")}
                defaultValue={value.name}
                onBlur={(e) => handleChange("name", id, e)}
              />

              <TextField
                className="w-full"
                label={t("Citizen.surname")}
                defaultValue={value.surname}
                onBlur={(e) => handleChange("surname", id, e)}
              />

              <TextField
                type="date"
                label={t("Citizen.dateOfBirth")}
                defaultValue={value.surname}
                onBlur={(e) => handleChange("dateOfBirth", id, e)}
              />

              <FormRow>
                <ValueSelectField
                  fieldName="gender"
                  valueType={ValueType.GENDER}
                  values={gender.values}
                  label={t("gender")}
                />

                <ValueSelectField
                  fieldName="ethnicity"
                  valueType={ValueType.ETHNICITY}
                  values={ethnicity.values}
                  label={t("ethnicity")}
                />
              </FormRow>
            </FormRow>
          );
        })}

        <div className="flex items-center justify-end gap-2 mt-3">
          <Button
            type="button"
            onPress={() => {
              setCitizens((p) => ({ ...p, ...createInitialCitizen() }));
            }}
          >
            {t("Management.addCitizenEntry")}
          </Button>

          <Button className="flex items-center gap-2" disabled={state === "loading"} type="submit">
            {state === "loading" ? <Loader /> : null}
            {t("Management.submit")}
          </Button>
        </div>
      </form>

      <ImportModal<PostImportCitizensData>
        id={ModalIds.ImportCitizens}
        url="/admin/import/citizens/file"
        onImport={() => void undefined}
      />
    </div>
  );
}

function createInitialCitizen() {
  return {
    [v4()]: { name: "", surname: "", gender: "", ethnicity: "", dateOfBirth: "" },
  };
}
