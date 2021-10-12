import type { Business, BusinessPost, Citizen, Employee, Value } from "types/prisma";
import create from "zustand";

export type FullEmployee = Employee & {
  citizen: Pick<Citizen, "id" | "name" | "surname">;
  role: Value<"BUSINESS_ROLE">;
};
export type FullBusiness = Business & {
  employees: FullEmployee[];
  citizen: Pick<Citizen, "id" | "name" | "surname">;
  businessPosts: BusinessPost[];
};

interface BusinessState {
  currentBusiness: FullBusiness | null;
  setCurrentBusiness: (bus: FullBusiness | null) => void;

  currentEmployee: FullEmployee | null;
  setCurrentEmployee: (em: FullEmployee | null) => void;

  posts: BusinessPost[];
  setPosts: (posts: BusinessPost[]) => void;
}

export const useBusinessState = create<BusinessState>((set) => ({
  currentBusiness: null,
  setCurrentBusiness: (business) => set({ currentBusiness: business }),

  currentEmployee: null,
  setCurrentEmployee: (employee) => set({ currentEmployee: employee }),

  posts: [],
  setPosts: (posts) => set({ posts }),
}));
