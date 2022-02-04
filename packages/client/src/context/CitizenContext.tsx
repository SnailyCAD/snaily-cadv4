import * as React from "react";
import type { FullRecord } from "components/leo/modals/NameSearchModal/RecordsArea";
import type { Citizen, MedicalRecord, RegisteredVehicle, Weapon } from "@snailycad/types";

export type CitizenWithVehAndWep = Citizen & {
  weapons: Weapon[];
  vehicles: RegisteredVehicle[];
  medicalRecords: MedicalRecord[];
  Record: FullRecord[];
};

interface Context<CitizenNull extends boolean = true> {
  citizen: CitizenNull extends true ? CitizenWithVehAndWep | null : CitizenWithVehAndWep;
  setCurrentCitizen: React.Dispatch<React.SetStateAction<CitizenWithVehAndWep | null>>;

  citizens: Citizen[];
  setCitizens: React.Dispatch<React.SetStateAction<Citizen[]>>;
}

const CitizenContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactChild | React.ReactChild[];
  initialData?: Partial<Pick<Context, "citizen" | "citizens">>;
}

export function CitizenProvider({ initialData, children }: ProviderProps) {
  const [citizens, setCitizens] = React.useState<Citizen[]>([]);
  const [citizen, setCurrentCitizen] = React.useState<CitizenWithVehAndWep | null>(
    initialData?.citizen ?? null,
  );

  React.useEffect(() => {
    if (initialData) {
      if (initialData.citizens) {
        setCitizens(initialData.citizens);
      }

      if (initialData.citizen) {
        setCurrentCitizen(initialData.citizen);
      }
    }
  }, [initialData]);

  const value = { citizens, citizen, setCitizens, setCurrentCitizen };

  return <CitizenContext.Provider value={value}>{children}</CitizenContext.Provider>;
}

/**
 *
 * @param citizenNull `true` = citizen can be null, `false` = citizen is never null
 */
export function useCitizen(citizenNull?: true): Context;
// @ts-expect-error not sure how to fix TS this error
export function useCitizen(citizenNull?: false): Context<false>;
export function useCitizen(citizenNull = true): Context {
  citizenNull;
  const context = React.useContext(CitizenContext);
  if (typeof context === "undefined") {
    throw new Error("`useCitizen` must be used within an `CitizenProvider`");
  }

  return context;
}
