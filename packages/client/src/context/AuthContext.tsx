import * as React from "react";
import { useRouter } from "next/router";
import { getSessionUser } from "lib/auth";
import { cad as CAD, Rank, User } from "@snailycad/types";
import { Loader } from "components/Loader";
import { useIsFeatureEnabled } from "lib/utils";
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
  children: React.ReactChild | React.ReactChild[];
  initialData: { session?: User | null; cad?: CAD | null };
}

const PERMISSIONS: Record<string, (user: User) => boolean> = {
  "/dispatch": (user) => user.isDispatch,
  "/officer/supervisor": (user) => user.isLeo && user.isSupervisor,
  "/officer": (user) => user.isLeo,
  "/ems-fd": (user) => user.isEmsFd,
  "/admin/manage/cad-settings": (user) => user.rank === Rank.OWNER,
  "/admin/manage/units": (user) => user.rank !== Rank.USER || user.isSupervisor,
  "/admin": (user) => user.rank !== Rank.USER,
  "/tow": (user) => user.isTow,
};

const NO_LOADING_ROUTES = ["/403", "/404", "/auth/login", "/auth/register"];

export function AuthProvider({ initialData, children }: ProviderProps) {
  const [user, setUser] = React.useState<User | null>(initialData.session ?? null);
  const [cad, setCad] = React.useState<CAD | null>(null);
  const [isForbidden, setForbidden] = React.useState(false);
  const router = useRouter();

  const isEnabled = useIsFeatureEnabled(cad ?? {});

  const handleGetUser = React.useCallback(async () => {
    getSessionUser()
      .then((u) => {
        if (!u && !NO_LOADING_ROUTES.includes(router.pathname)) {
          router.push("/auth/login");
        }

        setUser(u);
      })
      .catch(() => void 0);
  }, [router]);

  React.useEffect(() => {
    _setBodyTheme(user?.isDarkTheme ?? true);
  }, [user?.isDarkTheme]);

  React.useEffect(() => {
    if (user) {
      const p = hasPermissionForCurrentRoute(router.pathname, user);

      if (!p) {
        setForbidden(true);
        router.push("/403");
      }
    }
  }, [user, router]);

  React.useEffect(() => {
    handleGetUser();
  }, [handleGetUser]);

  React.useEffect(() => {
    if (initialData.session) {
      setUser(initialData.session);
    }

    // @ts-expect-error ignore
    if (initialData.session?.cad ?? initialData.cad) {
      // @ts-expect-error ignore
      setCad(initialData.session?.cad ?? initialData.cad);
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

  if ((!NO_LOADING_ROUTES.includes(router.pathname) && !user) || isForbidden) {
    return (
      <div id="unauthorized" className="fixed inset-0 grid bg-transparent place-items-center">
        <span aria-label="loading...">
          <Loader className="w-14 h-14 border-[3px]" />
        </span>
      </div>
    );
  }

  if (cad && !isEnabled) {
    return (
      <main className="grid h-screen place-items-center">
        <p>Feature is not enabled.</p>
      </main>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (typeof context === "undefined") {
    throw new Error("`useAuth` must be used within an `AuthProvider`");
  }

  return context;
}

function _setBodyTheme(isDarkTheme: boolean) {
  if (!isDarkTheme) {
    window.document.body.classList.remove("dark");
    return;
  }
  if (typeof window === "undefined") return;

  window.document.body.classList.add("dark");
}

function hasPermissionForCurrentRoute(path: string, user: User) {
  const key = Object.keys(PERMISSIONS).find((v) => path.startsWith(v));
  if (!key) return true;

  const pathPermission = PERMISSIONS[key];

  if (typeof pathPermission !== "function") return true;

  return pathPermission(user);
}
