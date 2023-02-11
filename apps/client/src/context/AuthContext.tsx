import * as React from "react";
import { useRouter } from "next/router";
import { type cad as CAD, type User, WhitelistStatus } from "@snailycad/types";
import { useIsRouteFeatureEnabled } from "../hooks/auth/useIsRouteFeatureEnabled";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";

interface Context {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;

  cad: CAD | null;
  setCad: React.Dispatch<React.SetStateAction<CAD | null>>;
}

const AuthContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  initialData: {
    userSavedIsDarkTheme?: "false" | "true";
    session?: (User & { cad: CAD | null }) | null;
    cad?: CAD | null;
  };
}

const NO_LOADING_ROUTES = [
  "/403",
  "/404",
  "/auth/login",
  "/auth/register",
  "/auth/pending",
  "/auth/temp-password",
  "/auth/connections",
];

export function AuthProvider({ initialData, children }: ProviderProps) {
  const [user, setUser] = React.useState<User | null>(initialData.session ?? null);
  const [cad, setCad] = React.useState<CAD | null>(
    initialData.cad ?? initialData.session?.cad ?? null,
  );

  const router = useRouter();
  const isEnabled = useIsRouteFeatureEnabled(cad ?? {});

  const handleGetUser = React.useCallback(async () => {
    const { getSessionUser } = await import("lib/auth");
    const { doesUserHaveAllRequiredConnections } = await import(
      "lib/validation/does-user-have-required-connections"
    );

    const user = await getSessionUser();

    if (
      user?.whitelistStatus === WhitelistStatus.PENDING &&
      !NO_LOADING_ROUTES.includes(router.pathname)
    ) {
      router.push("/auth/pending");

      setUser(user);
      return;
    }

    if (!user && !NO_LOADING_ROUTES.includes(router.pathname)) {
      const from = router.asPath;
      router.push(`/auth/login?from=${from}`);
    }

    if (
      user &&
      !NO_LOADING_ROUTES.includes(router.pathname) &&
      !doesUserHaveAllRequiredConnections({ user, features: cad?.features })
    ) {
      const from = router.asPath;
      router.push(`/auth/connections?from=${from}`);
    }

    setUser(user);
  }, [router, cad]);

  React.useEffect(() => {
    const savedDarkTheme = initialData.userSavedIsDarkTheme
      ? initialData.userSavedIsDarkTheme === "true"
      : true;

    const isDarkTheme = user?.isDarkTheme ?? savedDarkTheme;
    _setBodyTheme(isDarkTheme);
  }, [user?.isDarkTheme, initialData.userSavedIsDarkTheme]);

  React.useEffect(() => {
    handleGetUser();
  }, [handleGetUser]);

  React.useEffect(() => {
    if (initialData.session) {
      setUser(initialData.session);
    }

    if (initialData.cad || initialData.session?.cad) {
      setCad(initialData.cad ?? initialData.session?.cad ?? null);
    }
  }, [initialData]);

  useListener(
    SocketEvents.UserBanned,
    (userId) => {
      if (userId !== user?.id) return;
      router.push("/auth/login?error=banned");
    },
    [user?.id],
  );

  useListener(
    SocketEvents.UserDeleted,
    (userId) => {
      if (userId !== user?.id) return;
      router.push("/auth/login?error=deleted");
    },
    [user?.id],
  );

  const value = { user, cad, setCad, setUser };

  if (!NO_LOADING_ROUTES.includes(router.pathname) && !user) {
    return (
      <div id="unauthorized" className="fixed inset-0 grid bg-transparent place-items-center">
        <span aria-label="loading...">{/* <Loader className="w-14 h-14 border-[3px]" /> */}</span>
      </div>
    );
  }

  if (cad && !isEnabled) {
    return (
      <main className="grid h-screen place-items-center dark:text-white">
        <p>Feature is not enabled.</p>
      </main>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (typeof context === "undefined") {
    throw new TypeError("`useAuth` must be used within an `AuthProvider`");
  }

  return context;
}

function _setBodyTheme(isDarkTheme: boolean) {
  if (typeof window === "undefined") return;

  if (!isDarkTheme) {
    window.document.body.classList.remove("dark");
    return;
  }

  window.document.body.classList.add("dark");
}
