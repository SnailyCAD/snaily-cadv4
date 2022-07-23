import * as React from "react";
import type { Citizen, MedicalRecord, Record, RegisteredVehicle, Weapon } from "@snailycad/types";

export type CitizenWithVehAndWep = Citizen & {
  weapons: Weapon[];
  vehicles: RegisteredVehicle[];
  medicalRecords: MedicalRecord[];
  Record: Record[];
};

interface Context<CitizenNull extends boolean = true> {
  citizen: CitizenNull extends true ? CitizenWithVehAndWep | null : CitizenWithVehAndWep;
  setCurrentCitizen: React.Dispatch<React.SetStateAction<CitizenWithVehAndWep | null>>;

  citizens: Citizen[];
  setCitizens: React.Dispatch<React.SetStateAction<Citizen[]>>;
}

const CitizenContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
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
      } else {
        setCurrentCitizen(null);
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
export function useCitizen(citizenNull?: false): Context<false>;
export function useCitizen(citizenNull = true): Context<boolean> {
  citizenNull;
  const context = React.useContext(CitizenContext);
  if (typeof context === "undefined") {
    throw new TypeError("`useCitizen` must be used within an `CitizenProvider`");
  }

  return context;
}
