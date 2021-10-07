import * as React from "react";
import { useRouter } from "next/router";
import { getSessionUser } from "lib/auth";
import { User } from "types/prisma";

interface Context {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const SettingsContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactChild | React.ReactChild[];
  initialData: { session?: User | null };
}

export const AuthProvider = ({ initialData, children }: ProviderProps) => {
  const [user, setUser] = React.useState<User | null>(null);
  const router = useRouter();

  const handleGetUser = React.useCallback(async () => {
    getSessionUser().then((u) => {
      if (!u) {
        router.push("/auth/login");
      }

      setUser(u);
    });
  }, []);

  React.useEffect(() => {
    handleGetUser();
  }, [handleGetUser]);

  React.useEffect(() => {
    if (initialData.session) {
      setUser(initialData.session);
    }
  }, [initialData.session]);

  const value = { user, setUser };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useAuth() {
  const context = React.useContext(SettingsContext);
  if (typeof context === "undefined") {
    throw new Error("`useAuth` must be used within an `AuthProvider`");
  }

  return context;
}
